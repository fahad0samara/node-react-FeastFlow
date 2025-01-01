import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Replay,
  Receipt,
  AccessTime,
  Star,
  LocalShipping,
  Info,
} from '@mui/icons-material';
import { Order } from '../../types/order.types';

interface PreviousOrdersProps {
  orders: Order[];
  onReorder: (orderId: string) => void;
  onViewDetails: (orderId: string) => void;
}

const PreviousOrders: React.FC<PreviousOrdersProps> = ({
  orders,
  onReorder,
  onViewDetails,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Previous Orders
      </Typography>

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
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography variant="h6">Order #{order.id.slice(-6)}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <AccessTime sx={{ fontSize: 'small', mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(order.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={order.status.status}
                    color={getStatusColor(order.status.status)}
                    size="small"
                  />
                </Box>

                <List dense>
                  {order.items.map((item) => (
                    <ListItem key={item.id} disableGutters>
                      <ListItemText
                        primary={`${item.quantity}x ${item.menuItemId}`}
                        secondary={
                          item.specialInstructions && (
                            <Typography variant="caption" color="text.secondary">
                              Note: {item.specialInstructions}
                            </Typography>
                          )
                        }
                      />
                      <Typography variant="body2" color="primary">
                        ${(item.price * item.quantity).toFixed(2)}
                      </Typography>
                    </ListItem>
                  ))}
                </List>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mt: 2,
                    pt: 2,
                    borderTop: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2">Total Amount:</Typography>
                    <Typography variant="h6" color="primary">
                      ${order.totalAmount.toFixed(2)}
                    </Typography>
                  </Box>

                  <Box>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => onViewDetails(order.id)}
                        sx={{ mr: 1 }}
                      >
                        <Info />
                      </IconButton>
                    </Tooltip>
                    <Button
                      variant="contained"
                      startIcon={<Replay />}
                      onClick={() => onReorder(order.id)}
                      size="small"
                    >
                      Reorder
                    </Button>
                  </Box>
                </Box>

                {order.deliveryLocation && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      <LocalShipping sx={{ fontSize: 'small', mr: 1 }} />
                      Delivered to: {order.deliveryLocation.address}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default PreviousOrders;
