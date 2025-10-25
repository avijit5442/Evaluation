import React from 'react';
import CandidateCards from './components/CandidateCards';

export default function Dashboard() {
	return (
		<div style={{ padding: 16 }}>
			<h2>Candidate Dashboard</h2>
			<CandidateCards />
		</div>
	);
}

