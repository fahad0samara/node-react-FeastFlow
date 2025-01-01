import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Divider,
  Button,
  Chip,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import {
  LocalShipping,
  Restaurant,
  CheckCircle,
  Schedule,
  Phone,
} from '@mui/icons-material';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { Order, OrderStatus, Location } from '../../types/order.types';

interface OrderTrackingProps {
  order: Order;
  apiKey: string; // Google Maps API key
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ order, apiKey }) => {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<string>('');

  const orderSteps = [
    'Order Placed',
    'Confirmed',
    'Preparing',
    'Ready for Pickup',
    'On the Way',
    'Delivered',
  ];

  const getCurrentStepIndex = (status: OrderStatus['status']) => {
    const statusMap: Record<OrderStatus['status'], number> = {
      placed: 0,
      confirmed: 1,
      preparing: 2,
      ready: 3,
      picked_up: 4,
      delivering: 4,
      delivered: 5,
      cancelled: -1,
    };
    return statusMap[status];
  };

  useEffect(() => {
    if (order.status.driverDetails?.currentLocation && order.deliveryLocation) {
      const directionsService = new google.maps.DirectionsService();

      directionsService.route(
        {
          origin: {
            lat: order.status.driverDetails.currentLocation.latitude,
            lng: order.status.driverDetails.currentLocation.longitude,
          },
          destination: {
            lat: order.deliveryLocation.latitude,
            lng: order.deliveryLocation.longitude,
          },
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK') {
            setDirections(result);
            if (result?.routes[0]?.legs[0]?.duration?.text) {
              setEstimatedTime(result.routes[0].legs[0].duration.text);
            }
          }
        }
      );
    }
  }, [order.status.driverDetails?.currentLocation, order.deliveryLocation]);

  const renderDriverInfo = () => {
    if (!order.status.driverDetails) return null;

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Driver Information
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body1">
              {order.status.driverDetails.name}
            </Typography>
            <Button
              startIcon={<Phone />}
              href={`tel:${order.status.driverDetails.phone}`}
              sx={{ ml: 2 }}
            >
              Call Driver
            </Button>
          </Box>
          {order.status.driverDetails.vehicleInfo && (
            <Typography variant="body2" color="text.secondary">
              Vehicle: {order.status.driverDetails.vehicleInfo}
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderTimeline = () => {
    return (
      <Timeline>
        {Object.entries(order.status).map(([status, details], index) => (
          <TimelineItem key={status}>
            <TimelineSeparator>
              <TimelineDot color="primary">
                {status === 'delivering' ? <LocalShipping /> : <CheckCircle />}
              </TimelineDot>
              {index < Object.keys(order.status).length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="body1">
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(details.timestamp).toLocaleString()}
              </Typography>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    );
  };

  return (
    <Box>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Order Status
          </Typography>
          <Stepper
            activeStep={getCurrentStepIndex(order.status.status)}
            alternativeLabel
          >
            {orderSteps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {renderDriverInfo()}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Delivery Details
          </Typography>
          <Box sx={{ height: '400px', width: '100%', mb: 2 }}>
            <LoadScript googleMapsApiKey={apiKey}>
              <GoogleMap
                mapContainerStyle={{ height: '100%', width: '100%' }}
                center={{
                  lat: order.deliveryLocation.latitude,
                  lng: order.deliveryLocation.longitude,
                }}
                zoom={13}
              >
                {order.status.driverDetails?.currentLocation && (
                  <Marker
                    position={{
                      lat: order.status.driverDetails.currentLocation.latitude,
                      lng: order.status.driverDetails.currentLocation.longitude,
                    }}
                    icon={{
                      url: '/delivery-truck-icon.png',
                      scaledSize: new google.maps.Size(40, 40),
                    }}
                  />
                )}
                <Marker
                  position={{
                    lat: order.deliveryLocation.latitude,
                    lng: order.deliveryLocation.longitude,
                  }}
                />
                {directions && <DirectionsRenderer directions={directions} />}
              </GoogleMap>
            </LoadScript>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="body1">Estimated Delivery Time:</Typography>
            <Chip
              icon={<Schedule />}
              label={estimatedTime || 'Calculating...'}
              color="primary"
            />
          </Box>
          <Typography variant="body1" gutterBottom>
            Delivery Address:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {order.deliveryLocation.address}
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Order Timeline
          </Typography>
          {renderTimeline()}
        </CardContent>
      </Card>
    </Box>
  );
};

export default OrderTracking;
