import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Container, Table, Button, Alert, Form, Modal, Spinner } from 'react-bootstrap';
import { FaFacebook, FaTelegram, FaCopy, FaFilter, FaSearch } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { format } from 'date-fns';
import io from 'socket.io-client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';

// Initialize socket connection
const socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000');

function App() {
  const [numbers, setNumbers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRentModal, setShowRentModal] = useState(false);
  const [selectedService, setSelectedService] = useState('facebook');
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterService, setFilterService] = useState('all');
  const [services, setServices] = useState([]);
  const [specificNumber, setSpecificNumber] = useState('');
  const [specificService, setSpecificService] = useState('telegram');
  const [showSpecificNumberModal, setShowSpecificNumberModal] = useState(false);

  // Fetch Available Services
  const fetchServices = async () => {
    try {
      const response = await axios.get('/api/services');
      setServices(response.data);
    } catch (err) {
      setError('Failed to fetch services');
    }
  };

  // Fetch All Numbers
  const fetchNumbers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/numbers');
      setNumbers(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch numbers. Check server connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Messages
  const fetchMessages = async (numberId) => {
    try {
      const response = await axios.get(`/api/messages?number_id=${numberId}&limit=10`);
      setMessages(response.data);
    } catch (err) {
      setError('Failed to fetch messages.');
    }
  };

  // Rent New Number
  const rentNumber = async () => {
    try {
      setLoading(true);
      await axios.post('/api/rent', {
        service: selectedService,
        country: selectedCountry,
        quantity: 1
      });
      toast.success('Number rented successfully!');
      setShowRentModal(false);
      fetchNumbers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to rent number');
    } finally {
      setLoading(false);
    }
  };

  // Handle copy to clipboard
  const handleCopy = (text) => {
    toast.success('Copied to clipboard!');
  };

  // Filter numbers based on search and service filter
  const filteredNumbers = numbers.filter(num => {
    const matchesSearch = num.number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesService = filterService === 'all' || num.service === filterService;
    return matchesSearch && matchesService;
  });

  // Socket event listeners
  useEffect(() => {
    socket.on('newMessage', (data) => {
      setMessages(prev => [data, ...prev]);
      toast.info('New message received!');
    });

    socket.on('newNumber', (data) => {
      setNumbers(prev => [data, ...prev]);
      toast.success('New number added!');
    });

    return () => {
      socket.off('newMessage');
      socket.off('newNumber');
    };
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchNumbers();
    fetchServices();
    const interval = setInterval(fetchNumbers, 30000);
    return () => clearInterval(interval);
  }, [fetchNumbers]);

  // Fetch Messages for Specific Number
  const fetchSpecificNumberMessages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/messages/specific`, {
        params: {
          phone_number: specificNumber,
          service: specificService
        }
      });
      setMessages(response.data);
      setShowSpecificNumberModal(false);
      toast.success('Messages fetched successfully!');
    } catch (err) {
      toast.error('Failed to fetch messages for the specific number');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <ToastContainer position="top-right" />
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Nomaans OTP Receiver</h1>
        <div className="d-flex gap-2">
          <Button 
            onClick={() => setShowSpecificNumberModal(true)} 
            variant="success"
            disabled={loading}
          >
            {loading ? <Spinner size="sm" /> : 'Check Specific Number'}
          </Button>
          <Button 
            onClick={() => setShowRentModal(true)} 
            variant="primary"
            disabled={loading}
          >
            {loading ? <Spinner size="sm" /> : 'Rent New Number'}
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="mb-4">
        <div className="d-flex gap-3">
          <Form.Control
            type="text"
            placeholder="Search numbers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-50"
          />
          <Form.Select
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            className="w-25"
          >
            <option value="all">All Services</option>
            {services.map(service => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </Form.Select>
        </div>
      </div>

      <h4>Rented Numbers</h4>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Number</th>
            <th>Service</th>
            <th>Expiry</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredNumbers.map((num) => (
            <tr key={num.id}>
              <td>
                <div className="d-flex align-items-center gap-2">
                  {num.number}
                  <CopyToClipboard text={num.number} onCopy={handleCopy}>
                    <Button variant="link" size="sm">
                      <FaCopy />
                    </Button>
                  </CopyToClipboard>
                </div>
              </td>
              <td>
                {num.service === 'facebook' ? <FaFacebook className="text-primary" /> : <FaTelegram className="text-info" />}
                {' '}{num.service}
              </td>
              <td>{format(new Date(num.rent_expires_at), 'PPpp')}</td>
              <td>
                <Button 
                  onClick={() => fetchMessages(num.id)} 
                  variant="info"
                  size="sm"
                >
                  View Messages
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <h4 className="mt-5">Messages</h4>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Sender</th>
            <th>Message</th>
            <th>Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {messages.map((msg) => (
            <tr key={msg.id}>
              <td>{msg.sender}</td>
              <td>{msg.message}</td>
              <td>{format(new Date(msg.created_at), 'PPpp')}</td>
              <td>
                <CopyToClipboard text={msg.message} onCopy={handleCopy}>
                  <Button variant="link" size="sm">
                    <FaCopy />
                  </Button>
                </CopyToClipboard>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Specific Number Modal */}
      <Modal show={showSpecificNumberModal} onHide={() => setShowSpecificNumberModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Check Specific Number</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter phone number"
                value={specificNumber}
                onChange={(e) => setSpecificNumber(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Service</Form.Label>
              <Form.Select
                value={specificService}
                onChange={(e) => setSpecificService(e.target.value)}
              >
                <option value="telegram">Telegram</option>
                <option value="facebook">Facebook</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSpecificNumberModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={fetchSpecificNumberMessages} 
            disabled={loading || !specificNumber}
          >
            {loading ? <Spinner size="sm" /> : 'Submit'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Rent Number Modal */}
      <Modal show={showRentModal} onHide={() => setShowRentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Rent New Number</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Service</Form.Label>
              <Form.Select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
              >
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Country</Form.Label>
              <Form.Select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
              >
                <option value="US">United States</option>
                <option value="UK">United Kingdom</option>
                <option value="CA">Canada</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRentModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={rentNumber} disabled={loading}>
            {loading ? <Spinner size="sm" /> : 'Rent Number'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default App; 