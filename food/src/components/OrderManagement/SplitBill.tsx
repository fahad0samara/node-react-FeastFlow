import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Delete,
  Add,
  Payment,
  AccountBalance,
  CreditCard,
  Receipt,
} from '@mui/icons-material';
import { SplitBillParticipant, OrderItem } from '../../types/order.types';

interface SplitBillProps {
  orderItems: OrderItem[];
  participants: SplitBillParticipant[];
  onAddParticipant: (participant: Partial<SplitBillParticipant>) => void;
  onRemoveParticipant: (participantId: string) => void;
  onUpdateParticipant: (
    participantId: string,
    updates: Partial<SplitBillParticipant>
  ) => void;
  onComplete: () => void;
}

const SplitBill: React.FC<SplitBillProps> = ({
  orderItems,
  participants,
  onAddParticipant,
  onRemoveParticipant,
  onUpdateParticipant,
  onComplete,
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<SplitBillParticipant | null>(
    null
  );
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    email: '',
  });

  const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const splitAmount = totalAmount / (participants.length || 1);

  const handleAddParticipant = () => {
    if (newParticipant.name && newParticipant.email) {
      onAddParticipant({
        ...newParticipant,
        amount: splitAmount,
        status: 'pending',
        items: [],
      });
      setNewParticipant({ name: '', email: '' });
    }
  };

  const handleOpenPaymentDialog = (participant: SplitBillParticipant) => {
    setSelectedParticipant(participant);
    setOpenDialog(true);
  };

  const handlePaymentComplete = (paymentMethod: string) => {
    if (selectedParticipant) {
      onUpdateParticipant(selectedParticipant.id, {
        status: 'paid',
        paymentMethod,
      });
    }
    setOpenDialog(false);
  };

  const renderPaymentDialog = () => (
    <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
      <DialogTitle>Select Payment Method</DialogTitle>
      <DialogContent>
        <List>
          <ListItem button onClick={() => handlePaymentComplete('credit_card')}>
            <CreditCard sx={{ mr: 2 }} />
            <ListItemText primary="Credit Card" />
          </ListItem>
          <ListItem button onClick={() => handlePaymentComplete('bank_transfer')}>
            <AccountBalance sx={{ mr: 2 }} />
            <ListItemText primary="Bank Transfer" />
          </ListItem>
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );

  const renderItemsList = () => (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Order Items
        </Typography>
        <List>
          {orderItems.map((item) => (
            <ListItem key={item.id}>
              <ListItemText
                primary={item.menuItemId}
                secondary={`Quantity: ${item.quantity}`}
              />
              <Typography variant="body2" color="primary">
                ${(item.price * item.quantity).toFixed(2)}
              </Typography>
            </ListItem>
          ))}
          <Divider />
          <ListItem>
            <ListItemText primary="Total Amount" />
            <Typography variant="h6" color="primary">
              ${totalAmount.toFixed(2)}
            </Typography>
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Split Bill
      </Typography>

      {renderItemsList()}

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Participants
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={5}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={newParticipant.name}
                      onChange={(e) =>
                        setNewParticipant((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                    />
                  </Grid>
                  <Grid item xs={5}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={newParticipant.email}
                      onChange={(e) =>
                        setNewParticipant((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleAddParticipant}
                      startIcon={<Add />}
                    >
                      Add
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              <List>
                {participants.map((participant) => (
                  <ListItem key={participant.id}>
                    <ListItemText
                      primary={participant.name}
                      secondary={participant.email}
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 2 }}>
                          ${participant.amount.toFixed(2)}
                        </Typography>
                        <Chip
                          label={participant.status}
                          color={participant.status === 'paid' ? 'success' : 'warning'}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        {participant.status === 'pending' && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Payment />}
                            onClick={() => handleOpenPaymentDialog(participant)}
                            sx={{ mr: 1 }}
                          >
                            Pay
                          </Button>
                        )}
                        <IconButton
                          edge="end"
                          onClick={() => onRemoveParticipant(participant.id)}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Summary
              </Typography>
              <List>
                <ListItem>
                  <ListItemText primary="Total Amount" />
                  <Typography variant="h6" color="primary">
                    ${totalAmount.toFixed(2)}
                  </Typography>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Split Amount (per person)" />
                  <Typography variant="body1" color="primary">
                    ${splitAmount.toFixed(2)}
                  </Typography>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Paid Amount" />
                  <Typography variant="body1" color="success.main">
                    $
                    {participants
                      .filter((p) => p.status === 'paid')
                      .reduce((sum, p) => sum + p.amount, 0)
                      .toFixed(2)}
                  </Typography>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Remaining Amount" />
                  <Typography variant="body1" color="error.main">
                    $
                    {participants
                      .filter((p) => p.status === 'pending')
                      .reduce((sum, p) => sum + p.amount, 0)
                      .toFixed(2)}
                  </Typography>
                </ListItem>
              </List>

              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={onComplete}
                startIcon={<Receipt />}
                disabled={participants.some((p) => p.status === 'pending')}
                sx={{ mt: 2 }}
              >
                Complete Split Bill
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {renderPaymentDialog()}
    </Box>
  );
};

export default SplitBill;
