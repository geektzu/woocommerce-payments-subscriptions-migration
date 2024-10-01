/**
 * External Dependencies
 */
import { List } from 'react-content-loader';

/**
 * WordPress Dependencies
 */
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { Spinner, Button, ProgressBar } from '@wordpress/components';

const MigrationPage = ({
	selectedSubscriptions,
	selectedOriginPayment,
	selectedDestinationPayment,
	testResults,
	setTestResults,
	goToNextStep,
	goToPreviousStep,
	setMigrationResults,
	isLoading,
	setIsLoading,
}) => {
	const [currentPage, setCurrentPage] = useState(1);
	const [isProcessing, setIsProcessing] = useState(false);
	const [progress, setProgress] = useState(0);
	const [dryRunPage, setDryRunPage] = useState(1); // We'll reuse this state for the live run as well
	const [testResultsOnGreen, setTestResultsOnGreen] = useState([]);
	const perPage = window.wcpsm_migration_data.per_page * 1; // Ensure it's treated as a number

	const handleTest = async () => {
		setIsProcessing(true);
		setIsLoading(true);

		const totalBatches = Math.ceil(selectedSubscriptions.length / perPage);
		setProgress((1 / totalBatches) * 100);
		let allResults = [];

		for (let page = 1; page <= totalBatches; page++) {
			setDryRunPage(page); // Set the current dry run page
			const startIndex = (page - 1) * perPage;
			const subscriptionsBatch = selectedSubscriptions.slice(
				startIndex,
				startIndex + perPage
			);

			try {
				const response = await apiFetch({
					path: window.wcpsm_migration_data.endpoints?.dry_migrate,
					headers: {
						'X-WP-Nonce': window.wcpsm_migration_data.nonce,
					},
					method: 'POST',
					data: {
						subscriptions: subscriptionsBatch,
						origin_pm: selectedOriginPayment,
						destination_pm: selectedDestinationPayment,
					},
				});

				allResults = [...allResults, ...response.data];

				// Update progress
				setProgress(((page + 1) / totalBatches) * 100);
			} catch (error) {
				console.error('Error running test:', error);
			}
		}

		setTestResults(allResults);
		setTestResultsOnGreen(allResults.filter((res) => res.success === true));
		setIsProcessing(false);
		setIsLoading(false);
	};

	const handleRun = async () => {
		setIsProcessing(true);
		setIsLoading(true);

		const totalBatches = Math.ceil(selectedSubscriptions.length / perPage);
		setProgress((1 / totalBatches) * 100);
		let allResults = [];

		for (let page = 1; page <= totalBatches; page++) {
			setDryRunPage(page); // Reusing this for live run page indication
			const startIndex = (page - 1) * perPage;
			const subscriptionsBatch = selectedSubscriptions.slice(
				startIndex,
				startIndex + perPage
			);

			try {
				const response = await apiFetch({
					path: wcpsm_migration_data.endpoints?.migrate,
					headers: {
						'X-WP-Nonce': wcpsm_migration_data.nonce,
					},
					method: 'POST',
					data: {
						subscriptions: subscriptionsBatch,
						origin_pm: selectedOriginPayment,
						destination_pm: selectedDestinationPayment,
						finished: page === totalBatches, 
					},
				});

				allResults = [...allResults, ...response.data];

				// Update progress
				setProgress(((page + 1) / totalBatches) * 100);
			} catch (error) {
				console.error('Error running live migration:', error);
			}
		}

		setMigrationResults(allResults);
		setIsProcessing(false);
		setIsLoading(false);
		goToNextStep();
	};

	// Calculate subscriptions to display on the current page
	const startIndex = (currentPage - 1) * perPage;
	const currentSubscriptions = selectedSubscriptions.slice(
		startIndex,
		startIndex + perPage
	);

	// Handle pagination
	const totalPages = Math.ceil(selectedSubscriptions.length / perPage);

	const goToNextPage = () => {
		if (currentPage < totalPages) {
			setCurrentPage(currentPage + 1);
		}
	};

	const goToPreviousPage = () => {
		if (currentPage > 1) {
			setCurrentPage(currentPage - 1);
		}
	};

	return (
		<div className="wpsm-migration-page">
			<h2>Test Migration</h2>
			<p className="text-muted">
				We&apos;re ready for the migration. We need to do a test run
				first to check for all the condtions, and if they are met, we
				can run the actual migration.
			</p>
			{selectedSubscriptions.length > 0 ? (
				<>
					<div className="wpsm-migration-page__checkbox_list">
						<div className="wpsm-migration-page__checkbox_list_top"></div>
						<div className="wpsm-migration-page__checkbox_list_middle">
							{currentSubscriptions.map((subscription, index) => {
								const result = testResults.find(
									(res) => res.id === subscription.id
								);
								const statusText = result
									? result.message
									: 'Pending test';
								const statusColor = result
									? result.success
										? 'green'
										: 'red'
									: 'gray';
								const subscriptionName = result
									? result.name
									: subscription.name;

								return (
									<p
										key={index}
										style={{
											color: statusColor,
											opacity: result ? 1 : 0.5, // Grayed out if not tested yet
										}}
									>
										{`${subscriptionName} - ${statusText}`}
									</p>
								);
							})}
						</div>
						<div className="page__checkbox_list_bottom">
							<hr />
							<p className="text-footer">
								Total migrations to process:{' '}
								{testResultsOnGreen.length}
							</p>
						</div>

						{/* Display Progress Bar if processing */}
					</div>
					<div className="psm-migration-page__pagination">
						<Button
							variant="link"
							onClick={goToPreviousPage}
							disabled={currentPage === 1 || isProcessing}
						>
							Previous
						</Button>
						<span>
							Page {currentPage} of {totalPages}
						</span>
						<Button
							variant="link"
							onClick={goToNextPage}
							disabled={
								currentPage === totalPages || isProcessing
							}
						>
							Next
						</Button>
					</div>
				</>
			) : (
				<p>No subscriptions selected for migration.</p>
			)}

			{/* Buttons aligned together below the list */}
			<div className="wpsm-migration-page__actions">
				{isProcessing ? (
					<>
						<p>{`Page ${dryRunPage} of ${Math.ceil(
							selectedSubscriptions.length / perPage
						)}`}</p>
						<ProgressBar value={progress} />
					</>
				) : (
					<>
						<Button
							variant="secondary"
							onClick={goToPreviousStep}
							disabled={isProcessing}
						>
							Previous
						</Button>
						<div>
							<Button
								variant="primary"
								onClick={handleTest}
								disabled={isLoading || isProcessing}
							>
								{isLoading ? <Spinner /> : 'Test'}
							</Button>
							<span>&nbsp;</span>
							<Button
								variant="primary"
								onClick={handleRun}
								disabled={
									testResults.filter((res) => res.success)
										.length === 0 ||
									isLoading ||
									isProcessing
								}
							>
								{isLoading ? <Spinner /> : 'Run Migration'}
							</Button>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default MigrationPage;
