import React, { useState, useEffect } from 'react';
import { 
  Car, Plus, Edit2, Trash2, Image as ImageIcon, 
  Settings2, Fuel, Users, Package, Search, X, RotateCcw, EyeOff 
} from 'lucide-react';
import carService from '../../services/carService';

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
  return `${baseUrl}${path}`;
};

const FleetManager = () => {
  const [cars, setCars] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    dailyRate: '',
    seats: 4,
    transmission: 'Manual',
    fuelType: 'Petrol',
    carType: '',
    description: '',
    availability: 'Available',
  });
  const [images, setImages] = useState({
    image1: null,
    image2: null,
    image3: null,
  });

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      setLoading(true);
      const res = await carService.getAllCars();
      if (res.status === 'success') {
        setCars(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e, key) => {
    if (e.target.files && e.target.files[0]) {
      setImages(prev => ({ ...prev, [key]: e.target.files[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      Object.keys(images).forEach(key => {
        if (images[key]) data.append(key, images[key]);
      });

      if (editingCar) {
        await carService.updateCar(editingCar.id, data);
        alert('Vehicle updated successfully!');
      } else {
        await carService.createCar(data);
        alert('Vehicle saved successfully!');
      }
      setIsFormOpen(false);
      setEditingCar(null);
      resetForm();
      fetchCars();
    } catch (error) {
      console.error('Failed to save car:', error);
      alert('Error saving car');
    }
  };

  const handleSoftDelete = async (id) => {
    if (window.confirm('Hide this vehicle from customers? (Soft Delete — can be restored)')) {
      try {
        await carService.deleteCar(id);
        alert('Vehicle hidden from customers.');
        fetchCars();
      } catch (error) {
        console.error('Failed to soft delete car:', error);
        alert('Error hiding car');
      }
    }
  };

  const handleHardDelete = async (id) => {
    if (window.confirm('⚠️ PERMANENTLY delete this vehicle? This cannot be undone!')) {
      try {
        await carService.hardDeleteCar(id);
        alert('Vehicle permanently deleted.');
        fetchCars();
      } catch (error) {
        console.error('Failed to permanently delete car:', error);
        alert('Error deleting car');
      }
    }
  };

  const handleRestore = async (id) => {
    if (window.confirm('Restore this vehicle?')) {
      try {
        await carService.restoreCar(id);
        alert('Vehicle restored successfully!');
        fetchCars();
      } catch (error) {
        console.error('Failed to restore car:', error);
        alert('Error restoring car');
      }
    }
  };

  const openEdit = (car) => {
    setEditingCar(car);
    setFormData({
      name: car.name,
      dailyRate: car.dailyRate,
      seats: car.seats,
      transmission: car.transmission,
      fuelType: car.fuelType,
      carType: car.carType,
      description: car.description,
      availability: car.availability,
    });
    setImages({ image1: null, image2: null, image3: null });
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '', dailyRate: '', seats: 4, transmission: 'Manual',
      fuelType: 'Petrol', carType: '', description: '', availability: 'Available'
    });
    setImages({ image1: null, image2: null, image3: null });
  };

  const getStatusColor = (status, isDeleted) => {
    if (isDeleted) return '#6B7280';
    switch(status) {
      case 'Available': return '#10B981';
      case 'Booked': return '#3B82F6';
      case 'Maintenance': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Fleet Management</h1>
          <p style={{ color: '#6B7280', margin: '4px 0 0 0' }}>Manage your rental vehicles and inventory</p>
        </div>
        <button 
          onClick={() => { resetForm(); setEditingCar(null); setIsFormOpen(true); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            backgroundColor: '#0f172a', color: 'white', padding: '10px 20px',
            borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500'
          }}
        >
          <Plus size={20} />
          Add Vehicle
        </button>
      </div>

      {isFormOpen && (
        <div style={{
          backgroundColor: 'white', borderRadius: '12px', padding: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{editingCar ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
            <button onClick={() => setIsFormOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={24} color="#6B7280" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Vehicle Name</label>
                <input required name="name" value={formData.name} onChange={handleInputChange} style={inputStyle} placeholder="e.g. Toyota Camry 2023" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Daily Rate (ETB / Birr)</label>
                <input required type="number" name="dailyRate" value={formData.dailyRate} onChange={handleInputChange} style={inputStyle} placeholder="e.g. 2500" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Seats</label>
                <input required type="number" name="seats" value={formData.seats} onChange={handleInputChange} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Transmission</label>
                <select name="transmission" value={formData.transmission} onChange={handleInputChange} style={inputStyle}>
                  <option value="Manual">Manual</option>
                  <option value="Automatic">Automatic</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Fuel Type</label>
                <select name="fuelType" value={formData.fuelType} onChange={handleInputChange} style={inputStyle}>
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Vehicle Type</label>
                <input required name="carType" value={formData.carType} onChange={handleInputChange} style={inputStyle} placeholder="e.g. Sedan, SUV, 4x4, Minibus..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Status</label>
                <select name="availability" value={formData.availability} onChange={handleInputChange} style={inputStyle}>
                  <option value="Available">Available</option>
                  <option value="Booked">Booked</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Description</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} style={{ ...inputStyle, minHeight: '100px' }} placeholder="Vehicle description and features..." />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '1rem' }}>Vehicle Images (up to 3)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {[1, 2, 3].map(num => (
                  <div key={num} style={{ border: '2px dashed #E5E7EB', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
                    <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <ImageIcon color="#9CA3AF" size={24} />
                      <span style={{ fontSize: '14px', color: '#4B5563' }}>Image {num}</span>
                      <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleImageChange(e, `image${num}`)} />
                    </label>
                    {images[`image${num}`] && <p style={{ fontSize: '12px', color: '#10B981', marginTop: '8px', wordBreak: 'break-all' }}>{images[`image${num}`].name}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" onClick={() => setIsFormOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #D1D5DB', backgroundColor: 'white', color: '#374151', fontWeight: '500', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: 'white', fontWeight: '500', cursor: 'pointer' }}>{editingCar ? 'Update Vehicle' : 'Save Vehicle'}</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
            <tr>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Vehicle</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Rate/Day</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Specs</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>Loading vehicles...</td></tr>
            ) : cars.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>No vehicles found. Add your first vehicle above.</td></tr>
            ) : (
              cars.map(car => (
                <tr key={car.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {car.image1 ? <img src={getImageUrl(car.image1)} alt={car.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Car color="#9CA3AF" />}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: '600', color: car.deleted_at ? '#9CA3AF' : '#111827', textDecoration: car.deleted_at ? 'line-through' : 'none' }}>
                          {car.name}
                        </p>
                        <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>
                          {car.carType} {car.deleted_at && <span style={{ color: '#EF4444', fontWeight: 'bold' }}>(Deleted)</span>}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', color: '#111827', fontWeight: '500' }}>ETB {Number(car.dailyRate).toLocaleString()}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '12px', color: '#6B7280', fontSize: '13px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Settings2 size={14} /> {car.transmission}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Fuel size={14} /> {car.fuelType}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14} /> {car.seats}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '500',
                      backgroundColor: `${getStatusColor(car.availability, car.deleted_at)}20`,
                      color: getStatusColor(car.availability, car.deleted_at)
                    }}>
                      {car.deleted_at ? 'Deleted' : car.availability}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      {car.deleted_at ? (
                        /* Soft-deleted row: show Restore + Permanent Delete */
                        <>
                          <button
                            title="Restore: make visible to customers again"
                            onClick={() => handleRestore(car.id)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: '1px solid #10B981', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', color: '#10B981', fontSize: '12px', fontWeight: '600' }}
                          >
                            <RotateCcw size={13} /> Restore
                          </button>
                          <button
                            title="Permanently delete this vehicle (cannot be undone)"
                            onClick={() => handleHardDelete(car.id)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: '1px solid #EF4444', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', color: '#EF4444', fontSize: '12px', fontWeight: '600' }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </>
                      ) : (
                        /* Active row: Edit + Soft Delete + Hard Delete */
                        <>
                          <button
                            title="Edit this vehicle's details"
                            onClick={() => openEdit(car)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3B82F6', padding: '6px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center' }}
                          >
                            <Edit2 size={17} />
                          </button>
                          <button
                            title="Soft Delete: hide from customers (can be restored)"
                            onClick={() => handleSoftDelete(car.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F59E0B', padding: '6px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center' }}
                          >
                            <EyeOff size={17} />
                          </button>
                          <button
                            title="Permanently delete this vehicle (cannot be undone)"
                            onClick={() => handleHardDelete(car.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '6px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center' }}
                          >
                            <Trash2 size={17} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #D1D5DB',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box'
};

export default FleetManager;
