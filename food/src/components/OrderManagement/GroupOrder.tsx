import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Group,
  Add,
  Delete,
  Share,
  Timer,
  CheckCircle,
  Warning,
  Email,
} from '@mui/icons-material';
import { GroupOrder as GroupOrderType } from '../../types/order.types';

interface GroupOrderProps {
  groupOrder: GroupOrderType;
  onAddParticipant: (email: string) => void;
  onRemoveParticipant: (participantId: string) => void;
  onShareLink: () => void;
  onClose: () => void;
  onSubmitOrder: () => void;
  timeLeft: string;
}

const GroupOrder: React.FC<GroupOrderProps> = ({
  groupOrder,
  onAddParticipant,
  onRemoveParticipant,
  onShareLink,
  onClose,
  onSubmitOrder,
  timeLeft,
}) => {
  const [email, setEmail] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);

  const handleAddParticipant = () => {
    if (email) {
      onAddParticipant(email);
      setEmail('');
    }
  };

  const getParticipantStatus = (status: string) => {
    switch (status) {
      case 'ordered':
        return <Chip label="Ordered" color="success" size="small" />;
      case 'paid':
        return <Chip label="Paid" color="primary" size="small" />;
      default:
        return <Chip label="Pending" color="warning" size="small" />;
    }
  };

  const calculateProgress = () => {
    const ordered = groupOrder.participants.filter(
      (p) => p.status === 'ordered' || p.status === 'paid'
    ).length;
    return (ordered / groupOrder.participants.length) * 100;
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Typography variant="h5">Group Order</Typography>
            <Box>
              <Chip
                icon={<Timer />}
                label={`Expires in ${timeLeft}`}
                color="warning"
                sx={{ mr: 1 }}
              />
              <Button
                variant="contained"
                startIcon={<Share />}
                onClick={onShareLink}
                size="small"
              >
                Share
              </Button>
            </Box>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card variant="outlined">
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      label="Add participant by email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      sx={{ mr: 1 }}
                    />
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={handleAddParticipant}
                    >
                      Add
                    </Button>
                  </Box>

                  <List>
                    {groupOrder.participants.map((participant) => (
                      <React.Fragment key={participant.id}>
                        <ListItem>
                          <Avatar sx={{ mr: 2 }}>
                            {participant.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <ListItemText
                            primary={participant.name}
                            secondary={participant.email}
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getParticipantStatus(participant.status)}
                            <IconButton
                              edge="end"
                              onClick={() => onRemoveParticipant(participant.id)}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Order Progress
                  </Typography>
                  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <CircularProgress
                      variant="determinate"
                      value={calculateProgress()}
                      size={80}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="caption" component="div" color="text.secondary">
                        {`${Math.round(calculateProgress())}%`}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Total Amount: ${groupOrder.totalAmount.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {groupOrder.participants.length} participants
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 3 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      onClick={onSubmitOrder}
                      disabled={groupOrder.status !== 'open'}
                      startIcon={<CheckCircle />}
                    >
                      Submit Group Order
                    </Button>
                    <Button
                      fullWidth
                      onClick={onClose}
                      sx={{ mt: 1 }}
                      color="inherit"
                    >
                      Close
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default GroupOrder;
