import { useState, useEffect } from 'react';
import './App.css';
import EmployeeCard from './Dashboard.jsx';
import { Box, Typography, CircularProgress } from '@mui/material';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/submissions')
      .then((response) => response.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data.length) {
    return (
      <Typography variant="h6" align="center" sx={{ mt: 5 }}>
        No submissions found
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 2,
        p: 2,
      }}
    >
      {data.map((submission) => (
        <EmployeeCard key={submission.id} submission={submission} />
      ))}
    </Box>
  );
}

export default App;
