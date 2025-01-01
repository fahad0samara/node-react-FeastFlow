import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Schedule,
  Edit,
  Delete,
  Repeat,
  CalendarToday,
  AccessTime,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ScheduledOrder } from '../../types/order.types';

interface ScheduledOrdersProps {
  orders: ScheduledOrder[];
  onScheduleOrder: (order: Partial<ScheduledOrder>) => void;
  onEditOrder: (orderId: string, updates: Partial<ScheduledOrder>) => void;
  onDeleteOrder: (orderId: string) => void;
}

const ScheduledOrders: React.FC<ScheduledOrdersProps> = ({
  orders,
  onScheduleOrder,
  onEditOrder,
  onDeleteOrder,
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Partial<ScheduledOrder> | null>(
    null
  );
  const [isRecurring, setIsRecurring] = useState(false);

  const handleOpenDialog = (order?: ScheduledOrder) => {
    setSelectedOrder(order || {});
    setIsRecurring(!!order?.recurrence && order.recurrence !== 'none');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrder(null);
    setIsRecurring(false);
  };

  const handleSave = () => {
    if (selectedOrder) {
      if (selectedOrder.id) {
        onEditOrder(selectedOrder.id, selectedOrder);
      } else {
        onScheduleOrder(selectedOrder);
      }
    }
    handleCloseDialog();
  };

  const getRecurrenceText = (recurrence?: string) => {
    switch (recurrence) {
      case 'daily':
        return 'Every day';
      case 'weekly':
        return 'Every week';
      case 'monthly':
        return 'Every month';
      default:
        return 'One-time';
    }
  };

  const renderScheduleDialog = () => (
    <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
      <DialogTitle>
        {selectedOrder?.id ? 'Edit Scheduled Order' : 'Schedule New Order'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Delivery Date & Time"
                value={selectedOrder?.scheduledFor || null}
                onChange={(newValue) =>
                  setSelectedOrder((prev) => ({
                    ...prev,
                    scheduledFor: newValue,
                  }))
                }
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                />
              }
              label="Make this a recurring order"
            />
          </Grid>

          {isRecurring && (
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Recurrence</InputLabel>
                <Select
                  value={selectedOrder?.recurrence || 'none'}
                  onChange={(e) =>
                    setSelectedOrder((prev) => ({
                      ...prev,
                      recurrence: e.target.value,
                    }))
                  }
                  label="Recurrence"
                >
                  <MenuItem value="none">One-time</MenuItem>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Special Instructions"
              value={selectedOrder?.specialInstructions || ''}
              onChange={(e) =>
                setSelectedOrder((prev) => ({
                  ...prev,
                  specialInstructions: e.target.value,
                }))
              }
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Scheduled Orders</Typography>
        <Button
          variant="contained"
          startIcon={<Schedule />}
          onClick={() => handleOpenDialog()}
        >
          Schedule New Order
        </Button>
      </Box>

      <Grid container spacing={2}>
        {orders.map((order) => (
          <Grid item xs={12} md={6} key={order.id}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Order #{order.id.slice(-6)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarToday sx={{ mr: 1, fontSize: 'small' }} />
                      <Typography variant="body2">
                        {new Date(order.scheduledFor).toLocaleDateString()}
                      </Typography>
                      <AccessTime sx={{ ml: 2, mr: 1, fontSize: 'small' }} />
                      <Typography variant="body2">
                        {new Date(order.scheduledFor).toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(order)}
                      sx={{ mr: 1 }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onDeleteOrder(order.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>

                <Box sx={{ mt: 2 }}>
                  {order.recurrence && order.recurrence !== 'none' && (
                    <Chip
                      icon={<Repeat />}
                      label={getRecurrenceText(order.recurrence)}
                      color="primary"
                      size="small"
                      sx={{ mr: 1 }}
                    />
                  )}
                  <Chip
                    label={order.status}
                    color={
                      order.status === 'scheduled'
                        ? 'success'
                        : order.status === 'cancelled'
                        ? 'error'
                        : 'default'
                    }
                    size="small"
                  />
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Delivery Address:
                  </Typography>
                  <Typography variant="body2">
                    {order.deliveryLocation.address}
                  </Typography>
                </Box>

                {order.specialInstructions && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Special Instructions:
                    </Typography>
                    <Typography variant="body2">
                      {order.specialInstructions}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {renderScheduleDialog()}
    </Box>
  );
};

export default ScheduledOrders;
