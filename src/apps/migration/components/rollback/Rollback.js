const Rollback = ({ goBackToBase }) => {
	return (
		<div className="rollback">
			<button onClick={goBackToBase}>Back to Selection</button>
			<h2>Rollback Component</h2>
			<p>This is where the rollback process will go.</p>
		</div>
	);
};

export default Rollback;