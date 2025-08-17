import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Divider
} from '@mui/material';
import { format, addMinutes, isAfter, addDays } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { createAppointment, getMyAppointments, getStudioSchedule, updateAppointmentStatus, rescheduleAppointment } from '../services/appointmentService';
import { getUsersByRole } from '../services/userService';

const AppointmentManagement = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [studioSchedule, setStudioSchedule] = useState([]);
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    scheduled: 0,
    cancelled: 0
  });
  
  // New appointment form state
  const [appointmentForm, setAppointmentForm] = useState({
    clientName: '',
    type: 'Studio Shooting',
    scheduledAt: new Date(),
    duration: 60,
    notes: ''
  });

  // Get all appointments for the current user
  const fetchAppointments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getMyAppointments(page + 1, rowsPerPage);
      setAppointments(response.data.appointments || []);
      
      // Calculate stats
      const appts = response.data.appointments || [];
      setStats({
        total: appts.length,
        completed: appts.filter(a => a.status === 'completed').length,
        scheduled: appts.filter(a => a.status === 'scheduled').length,
        cancelled: appts.filter(a => a.status === 'cancelled').length
      });
      
      setIsLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to load appointments');
      setIsLoading(false);
    }
  }, [page, rowsPerPage]);

  // No longer needed - using text input instead of dropdown
  // const fetchClients = useCallback(async () => {
  //   if (user?.role === 'RECEPTIONIST' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'CLOSER') {
  //     try {
  //       const response = await getUsersByRole('CLIENT');
  //       setClients(response.data.users);
  //     } catch (err) {
  //       setError(err.message || 'Failed to load clients');
  //     }
  //   }
  // }, [user?.role]);

  // Get studio schedule for the selected date
  const fetchStudioSchedule = useCallback(async () => {
    if (selectedDate) {
      try {
        setIsLoading(true);
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const response = await getStudioSchedule(formattedDate);
        setStudioSchedule(response.data);
        setIsLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load studio schedule');
        setIsLoading(false);
      }
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    fetchStudioSchedule();
  }, [fetchStudioSchedule]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 1) {
      fetchStudioSchedule();
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAppointmentForm({
      ...appointmentForm,
      [name]: value
    });
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    const dateObj = new Date(value);
    
    if (name === "appointmentDate") {
      // Update only the date part
      const currentTime = appointmentForm.scheduledAt;
      dateObj.setHours(currentTime.getHours(), currentTime.getMinutes(), 0, 0);
    } else if (name === "appointmentTime") {
      // Update only the time part
      const [hours, minutes] = value.split(':');
      dateObj.setHours(parseInt(hours || 0, 10), parseInt(minutes || 0, 10), 0, 0);
    }
    
    setAppointmentForm({
      ...appointmentForm,
      scheduledAt: dateObj
    });
  };

  const handleScheduleAppointment = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      
      // Create the appointment
      await createAppointment(appointmentForm);
      
      // Reset form and refresh data
      setAppointmentForm({
        clientName: '',
        type: 'Studio Shooting',
        scheduledAt: new Date(),
        duration: 60,
        notes: ''
      });
      
      setSuccess('Appointment scheduled successfully! A notification email has been sent to the client.');
      fetchAppointments();
      fetchStudioSchedule();
      setOpenScheduleDialog(false);
      setIsLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to schedule appointment');
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      setIsLoading(true);
      await updateAppointmentStatus(appointmentId, newStatus);
      fetchAppointments();
      setSuccess(`Appointment status updated to ${newStatus}`);
      setIsLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to update appointment status');
      setIsLoading(false);
    }
  };

  const handleReschedule = async (appointmentId, newDate) => {
    try {
      setIsLoading(true);
      await rescheduleAppointment(appointmentId, newDate);
      fetchAppointments();
      setSuccess('Appointment rescheduled successfully');
      setIsLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to reschedule appointment');
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'MMM dd, yyyy - h:mm a');
  };

  // Get client display name
  const getClientDisplay = (appointment) => {
    if (appointment.clientName) {
      return appointment.clientName;
    }
    if (appointment.clientId) {
      return appointment.clientId.username || appointment.clientId.email || 'Unknown Client';
    }
    return 'Unknown Client';
  };

  // Get status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get status icon (using simple text instead of icon components)
  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
        return '🕒';
      case 'completed':
        return '✅';
      case 'cancelled':
        return '❌';
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
          📅 Appointments
        </Typography>
        
        {(user?.role === 'RECEPTIONIST' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'CLOSER') && (
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ 
              borderRadius: '8px', 
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              textTransform: 'none',
              fontWeight: 'bold',
              px: 2,
              py: 1
            }}
            onClick={() => setOpenScheduleDialog(true)}
          >
            ➕ Create appointment
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '8px' }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      {/* Stats Cards */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Appointments
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#333' }}>
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Completed
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {stats.completed}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Scheduled
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {stats.scheduled}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Cancelled
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                  {stats.cancelled}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Paper sx={{ borderRadius: '12px', overflow: 'hidden', mb: 4, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          sx={{ 
            px: 2, 
            pt: 2,
            '& .MuiTabs-indicator': {
              height: '3px',
              borderRadius: '1.5px'
            }
          }}
        >
          <Tab 
            label="My Appointments" 
            sx={{ 
              fontWeight: 'bold', 
              textTransform: 'none',
              fontSize: '1rem'
            }}
          />
          {(user?.role === 'RECEPTIONIST' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'CLOSER') && (
            <Tab 
              label="Studio Schedule" 
              sx={{ 
                fontWeight: 'bold', 
                textTransform: 'none',
                fontSize: '1rem'
              }}
            />
          )}
        </Tabs>
        
        <Divider />

        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
                <CircularProgress />
              </Box>
            ) : appointments.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Date & Time</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Client</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Duration</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {appointments.map((appointment) => (
                      <TableRow key={appointment._id} hover>
                        <TableCell>{formatDateTime(appointment.scheduledAt)}</TableCell>
                        <TableCell>
                          {getClientDisplay(appointment)}
                        </TableCell>
                        <TableCell>{appointment.type}</TableCell>
                        <TableCell>{appointment.duration} minutes</TableCell>
                        <TableCell>
                          <Chip 
                            label={appointment.status} 
                            color={getStatusColor(appointment.status)}
                            sx={{ 
                              fontWeight: 'medium',
                              borderRadius: '6px',
                              textTransform: 'capitalize'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {appointment.status === 'scheduled' && (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button 
                                size="small" 
                                variant="outlined"
                                color="error" 
                                onClick={() => handleStatusChange(appointment._id, 'cancelled')}
                                sx={{ borderRadius: '6px', textTransform: 'none' }}
                              >
                                Cancel
                              </Button>
                              
                              {(user?.role === 'RECEPTIONIST' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'CLOSER') && (
                                <Button 
                                  size="small" 
                                  variant="contained"
                                  color="success" 
                                  onClick={() => handleStatusChange(appointment._id, 'completed')}
                                  sx={{ borderRadius: '6px', textTransform: 'none' }}
                                >
                                  Complete
                                </Button>
                              )}
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={appointments.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handlePageChange}
                  onRowsPerPageChange={handleRowsPerPageChange}
                />
              </TableContainer>
            ) : (
              <Box sx={{ 
                py: 8, 
                textAlign: 'center', 
                color: 'text.secondary',
                backgroundColor: 'rgba(0,0,0,0.02)',
                borderRadius: '8px'
              }}>
                <Typography variant="h6">No appointments found</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {(user?.role === 'RECEPTIONIST' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'CLOSER') 
                    ? "Create your first appointment by clicking the 'Create appointment' button"
                    : "Your upcoming appointments will appear here"
                  }
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {tabValue === 1 && (user?.role === 'RECEPTIONIST' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'CLOSER') && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
              <TextField
                label="Select Date"
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                InputLabelProps={{ shrink: true }}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px'
                  }
                }}
              />

              <Button
                variant="outlined"
                color="primary"
                onClick={fetchStudioSchedule}
                sx={{ 
                  borderRadius: '8px',
                  textTransform: 'none'
                }}
              >
                🔄 Refresh Schedule
              </Button>
            </Box>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={2}>
                {studioSchedule.map((slot, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card 
                      sx={{ 
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                        backgroundColor: slot.available ? 'rgba(76, 175, 80, 0.04)' : 'rgba(244, 67, 54, 0.04)',
                        border: slot.available ? '1px solid rgba(76, 175, 80, 0.2)' : '1px solid rgba(244, 67, 54, 0.2)',
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
                        }
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {format(new Date(slot.startTime), 'h:mm a')} - {format(new Date(slot.endTime), 'h:mm a')}
                        </Typography>
                        
                        {slot.available ? (
                          <Button 
                            variant="contained" 
                            color="primary" 
                            fullWidth 
                            sx={{ 
                              mt: 2,
                              borderRadius: '8px',
                              textTransform: 'none',
                              fontWeight: 'bold'
                            }}
                            onClick={() => {
                              setAppointmentForm({
                                ...appointmentForm,
                                scheduledAt: new Date(slot.startTime)
                              });
                              setOpenScheduleDialog(true);
                            }}
                          >
                            ➕ Schedule
                          </Button>
                        ) : (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              <strong>Client:</strong> {slot.appointment.clientName}
                            </Typography>
                            <Chip 
                              label={`${getStatusIcon(slot.appointment.status)} ${slot.appointment.status}`} 
                              color={getStatusColor(slot.appointment.status)}
                              size="small"
                              sx={{ 
                                mt: 1,
                                fontWeight: 'medium',
                                borderRadius: '6px',
                                textTransform: 'capitalize'
                              }}
                            />
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Paper>

      {/* New Appointment Dialog */}
      <Dialog 
        open={openScheduleDialog} 
        onClose={() => setOpenScheduleDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ 
          sx: { 
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
          } 
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>Schedule New Appointment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="clientName"
                label="Client Name"
                value={appointmentForm.clientName}
                onChange={handleInputChange}
                fullWidth
                required
                placeholder="Enter client name"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="type-select-label">Appointment Type</InputLabel>
                <Select
                  labelId="type-select-label"
                  name="type"
                  value={appointmentForm.type}
                  onChange={handleInputChange}
                  required
                  label="Appointment Type"
                  sx={{ borderRadius: '8px' }}
                >
                  <MenuItem value="Google Meet">Google Meet</MenuItem>
                  <MenuItem value="Phone Call">Phone Call</MenuItem>
                  <MenuItem value="Studio Shooting">Studio Shooting</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                name="appointmentDate"
                label="Date"
                type="date"
                value={format(appointmentForm.scheduledAt, 'yyyy-MM-dd')}
                onChange={handleDateChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                name="appointmentTime"
                label="Time"
                type="time"
                value={format(appointmentForm.scheduledAt, 'HH:mm')}
                onChange={handleDateChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                name="duration"
                label="Duration (minutes)"
                type="number"
                value={appointmentForm.duration}
                onChange={handleInputChange}
                fullWidth
                InputProps={{ inputProps: { min: 15, step: 15 } }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Notes"
                value={appointmentForm.notes}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setOpenScheduleDialog(false)}
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none'
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleScheduleAppointment} 
            color="primary" 
            variant="contained"
            disabled={isLoading}
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 'bold',
              px: 3
            }}
          >
            {isLoading ? <CircularProgress size={24} /> : "Schedule Appointment"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentManagement; 