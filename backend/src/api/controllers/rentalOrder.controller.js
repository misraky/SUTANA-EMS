const rentalOrderRepository = require('../../repositories/rentalOrder.repository');
const carRepository = require('../../repositories/car.repository');
const notificationRepository = require('../../repositories/notification.repository');
const RentalOrder = require('../../models/RentalOrder.model');
const AppError = require('../../utils/AppError');
const { logger } = require('../../config/logger');

exports.createOrder = async (req, res, next) => {
  try {
    const data = req.body;
    
    // Calculate total days
    const pickup = new Date(data.pickupDate);
    const returnDate = new Date(data.returnDate);
    const totalDays = Math.ceil((returnDate - pickup) / (1000 * 60 * 60 * 24));
    
    if (totalDays <= 0) {
      return res.status(400).json({ status: 'error', message: 'Return date must be after pickup date' });
    }

    const car = await carRepository.findById(data.carId);
    if (!car) {
      return res.status(404).json({ status: 'error', message: 'Car not found' });
    }

    const rentalAmount = car.dailyRate * totalDays;
    const securityDeposit = 5000;
    const totalAmount = rentalAmount + securityDeposit;

    const orderNumber = RentalOrder.generateOrderNumber();

    const orderData = {
      car_id: car.id,
      customer_id: req.user.id,
      order_number: orderNumber,
      customer_name: req.user.fullName,
      customer_email: req.user.email,
      customer_phone: req.user.phone || '',
      driver_name: data.driverName,
      driver_license: data.driverLicense,
      pickup_date: new Date(data.pickupDate),
      return_date: new Date(data.returnDate),
      total_days: totalDays,
      daily_rate: car.dailyRate,
      rental_amount: rentalAmount,
      security_deposit: securityDeposit,
      total_amount: totalAmount,
      payment_method: data.paymentMethod || 'Cash',
      special_requests: data.specialRequests || '',
      status: 'PENDING_APPROVAL'
    };

    const newOrder = await rentalOrderRepository.create(orderData);
    
    // Also mark car as 'Booked' temporarily or let the manager do it upon approval. 
    // We'll leave the car as is until approved by the manager.

    res.status(201).json({
      status: 'success',
      message: 'Rental reservation submitted successfully',
      data: newOrder.toJSON()
    });
  } catch (error) {
    logger.error('Error creating rental order:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create rental order' });
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await rentalOrderRepository.findAll();
    res.status(200).json({
      status: 'success',
      data: orders.map(o => o.toJSON())
    });
  } catch (error) {
    logger.error('Error fetching rental orders:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch rental orders' });
  }
};

exports.getCustomerOrders = async (req, res, next) => {
  try {
    const orders = await rentalOrderRepository.findAll({ filters: { customerId: req.user.id } });
    res.status(200).json({
      status: 'success',
      data: orders.map(o => o.toJSON())
    });
  } catch (error) {
    logger.error('Error fetching customer rental orders:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch your rental orders' });
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, managerNote } = req.body;

    const order = await rentalOrderRepository.findById(id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    const extraData = {};
    if (managerNote) extraData.manager_note = managerNote;
    
    if (status === 'APPROVED') extraData.approved_at = new Date();
    if (status === 'REJECTED') extraData.rejected_at = new Date();

    const updated = await rentalOrderRepository.updateStatus(id, status, extraData);

    // If approved, update car status to Booked
    if (status === 'APPROVED') {
       await carRepository.update(order.carId, { availability: 'Booked' });
    }

    res.status(200).json({
      status: 'success',
      message: `Order ${status.toLowerCase()} successfully`,
      data: updated.toJSON()
    });
  } catch (error) {
    logger.error('Error updating rental order status:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update order status' });
  }
};

exports.uploadPaymentProof = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await rentalOrderRepository.findById(id);
    
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }
    
    if (order.customerId !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Not authorized' });
    }

    if (order.status !== 'APPROVED' && order.additionalOwed <= 0) {
      return res.status(400).json({ status: 'error', message: 'Payment proof not required for this order currently' });
    }

    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No proof file provided' });
    }

    const proofUrl = `/uploads/receipts/${req.file.filename}`;
    
    // Determine the new payment_status
    // If it's an approved order, it becomes PENDING_VERIFICATION.
    // If it's an active/completed order, we don't change the main status, but we update payment_status to PENDING_VERIFICATION.
    const updateData = {
      payment_proof_url: proofUrl,
      payment_status: 'PENDING_VERIFICATION'
    };

    const updated = await rentalOrderRepository.update(id, updateData);


    res.status(200).json({
      status: 'success',
      message: 'Payment proof uploaded successfully',
      data: updated.toJSON()
    });
  } catch (error) {
    logger.error('Error uploading payment proof:', error);
    res.status(500).json({ status: 'error', message: 'Failed to upload payment proof' });
  }
};

exports.getPendingPayments = async (req, res) => {
  try {
    const orders = await rentalOrderRepository.findPendingFinanceActions();
    res.status(200).json({
      status: 'success',
      data: orders.map(o => o.toJSON())
    });
  } catch (error) {
    logger.error('Error fetching pending payments:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch pending payments' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified, verifiedAmount, referenceNumber, notes } = req.body;

    const order = await rentalOrderRepository.findById(id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    let updateData = {};
    let notificationTitle = '';
    let notificationMessage = '';
    
    if (isVerified) {
      if (order.status === 'APPROVED') {
        // Initial Payment
        updateData = {
          payment_status: 'PAID',
          status: 'CONFIRMED',
          verified_amount: verifiedAmount,
          payment_reference: referenceNumber,
          finance_notes: notes,
          verified_by: req.user.id,
          verified_by_finance_at: new Date()
        };
        notificationTitle = 'Payment Confirmed';
        notificationMessage = `Payment for order ${order.orderNumber} is confirmed. Your rental is CONFIRMED.`;
      } else if (order.additionalOwed > 0) {
        // Additional Payment (Extension / Late Fee)
        const remaining = Math.max(0, order.additionalOwed - verifiedAmount);
        updateData = {
          additional_owed: remaining,
          payment_reference: referenceNumber,
          finance_notes: notes,
          verified_by: req.user.id,
          verified_by_finance_at: new Date()
        };
        // If fully paid additional amount, change payment status back to paid
        if (remaining === 0) {
          updateData.payment_status = 'PAID';
        }
        notificationTitle = 'Additional Payment Confirmed';
        notificationMessage = `Additional payment of ${verifiedAmount} ETB for order ${order.orderNumber} is confirmed. Remaining balance: ${remaining} ETB.`;
      } else if (order.refundAmount > 0) {
        // Processing Refund
        updateData = {
          refund_amount: 0,
          finance_notes: notes,
          verified_by: req.user.id,
          verified_by_finance_at: new Date()
        };
        notificationTitle = 'Refund Processed';
        notificationMessage = `Your refund of ${order.refundAmount} ETB for order ${order.orderNumber} has been processed.`;
      }
    } else {
      updateData = {
        payment_status: 'UNPAID', // back to unpaid so they can re-upload
        finance_notes: notes,
        verified_by: req.user.id,
        verified_by_finance_at: new Date()
      };
      notificationTitle = 'Payment Rejected';
      notificationMessage = `Your payment for order ${order.orderNumber} was rejected. Reason: ${notes}. Please review and try again.`;
    }

    if (notificationTitle) {
      await notificationRepository.create({
        userId: order.customerId,
        title: notificationTitle,
        message: notificationMessage
      });
    }

    const updated = await rentalOrderRepository.update(id, updateData);

    res.status(200).json({
      status: 'success',
      message: isVerified ? 'Action processed successfully' : 'Payment rejected',
      data: updated.toJSON()
    });
  } catch (error) {
    logger.error('Error verifying payment:', error);
    res.status(500).json({ status: 'error', message: 'Failed to verify payment' });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const order = await rentalOrderRepository.findById(id);
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });
    
    if (order.customerId !== req.user.id && req.user.department_id !== 2) {
      return res.status(403).json({ status: 'error', message: 'Not authorized' });
    }

    if (['ACTIVE', 'COMPLETED', 'CLOSED', 'CANCELLED'].includes(order.status)) {
      return res.status(400).json({ status: 'error', message: 'Order cannot be cancelled at this stage' });
    }

    if (!reason) {
      return res.status(400).json({ status: 'error', message: 'Cancellation reason is required' });
    }

    const updated = await rentalOrderRepository.update(id, { 
      is_cancellation_requested: true,
      cancellation_reason: reason
    });

    await notificationRepository.create({
      roleTarget: 'MANAGER',
      title: 'Cancellation Request',
      message: `Customer ${order.customerName} requested to cancel Order ${order.orderNumber}. Reason: ${reason}`
    });

    res.status(200).json({ status: 'success', data: updated.toJSON() });
  } catch (error) {
    logger.error('Error requesting order cancellation:', error);
    res.status(500).json({ status: 'error', message: 'Failed to request cancellation' });
  }
};

exports.approveCancellation = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    const order = await rentalOrderRepository.findById(id);
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });

    if (!isApproved) {
      const updated = await rentalOrderRepository.update(id, { 
        is_cancellation_requested: false,
        cancellation_reason: null
      });
      await notificationRepository.create({
        userId: order.customerId,
        title: 'Cancellation Rejected',
        message: `Your request to cancel order ${order.orderNumber} was rejected by the manager.`
      });
      return res.status(200).json({ status: 'success', data: updated.toJSON() });
    }

    const updateData = { 
      status: 'CANCELLED',
      is_cancellation_requested: false 
    };
    
    if (order.paymentStatus === 'PAID') {
      updateData.refund_amount = order.totalAmount;
      await notificationRepository.create({
        roleTarget: 'FINANCE',
        title: 'Refund Required',
        message: `Order ${order.orderNumber} was cancelled and requires a refund of ${order.totalAmount}.`
      });
    }

    const updated = await rentalOrderRepository.update(id, updateData);
    await carRepository.update(order.carId, { availability: 'Available' });

    await notificationRepository.create({
      userId: order.customerId,
      title: 'Order Cancelled',
      message: `Your order ${order.orderNumber} has been successfully cancelled.`
    });

    res.status(200).json({ status: 'success', data: updated.toJSON() });
  } catch (error) {
    logger.error('Error approving cancellation:', error);
    res.status(500).json({ status: 'error', message: 'Failed to approve cancellation' });
  }
};

exports.extendOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { days } = req.body;
    
    const order = await rentalOrderRepository.findById(id);
    if (!order || order.customerId !== req.user.id) return res.status(404).json({ status: 'error', message: 'Order not found' });
    
    if (order.status !== 'ACTIVE') {
      return res.status(400).json({ status: 'error', message: 'Only active rentals can be extended' });
    }

    await rentalOrderRepository.update(id, { pending_extension_days: days });

    const extensionFee = days * order.dailyRate;
    
    await notificationRepository.create({
      roleTarget: 'MANAGER',
      title: 'Extension Request',
      message: `Customer ${order.customerId} requested a ${days}-day extension for Order ${order.orderNumber}.`
    });

    res.status(200).json({ status: 'success', message: 'Extension requested successfully' });
  } catch (error) {
    logger.error('Error requesting extension:', error);
    res.status(500).json({ status: 'error', message: 'Failed to request extension' });
  }
};

exports.approveExtension = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved, days } = req.body;

    const order = await rentalOrderRepository.findById(id);
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });

    if (!isApproved) {
      await rentalOrderRepository.update(id, { pending_extension_days: null });
      await notificationRepository.create({
        userId: order.customerId,
        title: 'Extension Rejected',
        message: `Your extension request for ${order.orderNumber} was rejected.`
      });
      return res.status(200).json({ status: 'success', message: 'Extension rejected' });
    }

    const currentReturnDate = new Date(order.returnDate);
    currentReturnDate.setDate(currentReturnDate.getDate() + parseInt(days));
    const extensionFee = parseInt(days) * order.dailyRate;

    const updated = await rentalOrderRepository.update(id, {
      return_date: currentReturnDate,
      extended_return_date: currentReturnDate,
      extension_fee: extensionFee,
      total_amount: order.totalAmount + extensionFee,
      additional_owed: order.additionalOwed ? order.additionalOwed + extensionFee : extensionFee,
      pending_extension_days: null,
      payment_status: 'UNPAID' // Reset so finance sees it and customer can upload new proof
    });

    // Notify customer
    await notificationRepository.create({
      userId: order.customerId,
      title: 'Extension Approved — Payment Required',
      message: `Your extension for order ${order.orderNumber} is approved (+${days} days). Additional fee: ${extensionFee.toLocaleString()} ETB. Please submit proof of payment.`
    });

    // Notify finance
    await notificationRepository.create({
      roleTarget: 'Finance',
      title: 'Extension Fee Pending Verification',
      message: `Order ${order.orderNumber} has an approved extension. Additional fee of ${extensionFee.toLocaleString()} ETB is pending payment from customer.`
    });

    res.status(200).json({ status: 'success', data: updated.toJSON() });
  } catch (error) {
    logger.error('Error approving extension:', error);
    res.status(500).json({ status: 'error', message: 'Failed to approve extension' });
  }
};

exports.processReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { damageFee, fuelFee, lateFee, odometer, notes } = req.body;

    const order = await rentalOrderRepository.findById(id);
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });

    const extraCharges = parseFloat(damageFee || 0) + parseFloat(fuelFee || 0) + parseFloat(lateFee || 0);
    const existingAdditional = parseFloat(order.additionalOwed || 0);
    const newAdditional = existingAdditional + extraCharges;
    
    let refund = 0;
    let netDue = newAdditional;

    // Subtract deposit if applicable
    if (order.securityDeposit > 0) {
      if (order.securityDeposit >= netDue) {
        refund = order.securityDeposit - netDue;
        netDue = 0;
      } else {
        netDue = netDue - order.securityDeposit;
        refund = 0;
      }
    }

    const updated = await rentalOrderRepository.update(id, {
      status: 'COMPLETED',
      damage_fee: damageFee || 0,
      fuel_fee: fuelFee || 0,
      late_fee: lateFee || 0,
      actual_return_time: new Date(),
      actual_return_odometer: odometer,
      additional_owed: netDue,
      refund_amount: refund,
      manager_note: notes
    });

    await carRepository.update(order.carId, { availability: 'Available' });

    await notificationRepository.create({
      userId: order.customerId,
      title: 'Car Returned - Final Invoice',
      message: `Return processed for ${order.orderNumber}. Refund: ${refund} ETB. Additional Owed: ${netDue} ETB.`
    });

    res.status(200).json({ status: 'success', message: 'Return processed', data: updated.toJSON() });
  } catch (error) {
    logger.error('Error processing return:', error);
    res.status(500).json({ status: 'error', message: 'Failed to process return' });
  }
};

exports.markNoShow = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await rentalOrderRepository.findById(id);
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });
    if (order.status !== 'CONFIRMED') return res.status(400).json({ status: 'error', message: 'Only confirmed orders can be marked as No-Show' });

    const noShowFee = order.dailyRate;
    const totalPaid = order.totalAmount;
    const refundAmount = totalPaid - noShowFee;

    const updated = await rentalOrderRepository.update(id, {
      status: 'CANCELLED',
      manager_note: 'Manually marked as No-Show by Manager',
      refund_amount: Math.max(0, refundAmount)
    });

    await carRepository.update(order.carId, { availability: 'Available' });
    
    await notificationRepository.create({
      userId: order.customerId,
      title: 'Order Cancelled - No Show',
      message: `Your order ${order.orderNumber} was marked as No-Show by the manager. A no-show fee of ETB ${noShowFee} was charged. Refund: ETB ${Math.max(0, refundAmount)}.`
    });

    res.status(200).json({ status: 'success', message: 'Order marked as No-Show', data: updated.toJSON() });
  } catch (error) {
    logger.error('Error marking no show:', error);
    res.status(500).json({ status: 'error', message: 'Failed to mark order as No-Show' });
  }
};

exports.updatePickupRemarks = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    
    const order = await rentalOrderRepository.findById(id);
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });
    
    // Both customer and manager can update this
    const updated = await rentalOrderRepository.update(id, { pickup_remarks: remarks });
    res.status(200).json({ status: 'success', message: 'Pickup remarks updated', data: updated.toJSON() });
  } catch (error) {
    logger.error('Error updating pickup remarks:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update pickup remarks' });
  }
};
