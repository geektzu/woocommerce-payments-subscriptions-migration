import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { Button, Spinner, ProgressBar } from '@wordpress/components';

const RollbackPage = ({
	selectedSubscriptions,
	testResults,
	setTestResults,
	goToNextStep,
	goToPreviousStep,
	setRollbackResults,
	isLoading,
	setIsLoading,
}) => {
	const [isProcessing, setIsProcessing] = useState(false);
	const [progress, setProgress] = useState(0);
	const perPage = window.wcpsm_migration_data.per_page * 1;

	const handleRollback = async () => {
		setIsProcessing(true);
		setIsLoading(true);

		const totalBatches = Math.ceil(selectedSubscriptions.length / perPage);
		let allResults = [];

		for (let page = 1; page <= totalBatches; page++) {
			const startIndex = (page - 1) * perPage;
			const subscriptionsBatch = selectedSubscriptions.slice(
				startIndex,
				startIndex + perPage
			);

			try {
				const response = await apiFetch({
					path: window.wcpsm_migration_data.endpoints?.rollback,
					headers: {
						'X-WP-Nonce': window.wcpsm_migration_data.nonce,
					},
					method: 'POST',
					data: {
						subscriptions: subscriptionsBatch,
					},
				});

				allResults = [...allResults, ...response.data];
				setProgress(((page + 1) / totalBatches) * 100);
			} catch (error) {
				console.error('Error running rollback:', error);
			}
		}

		setRollbackResults(allResults);
		setIsProcessing(false);
		setIsLoading(false);
		goToNextStep();
	};

	return (
		<div className="wpsm-migration-page">
			<h2>Rollback Process</h2>
			<p>
				This is where we roll back changes for selected subscriptions.
				Click "Run Rollback" to begin the process.
			</p>
			{isProcessing ? (
				<ProgressBar value={progress} />
			) : (
				<Button
					variant="primary"
					onClick={handleRollback}
					disabled={isLoading}
				>
					Run Rollback
				</Button>
			)}
			<Button variant="secondary" onClick={goToPreviousStep} disabled={isProcessing}>
				Previous
			</Button>
		</div>
	);
};

export default RollbackPage;