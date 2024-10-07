/**
 * WordPress Dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { Spinner, Button, ProgressBar, Icon } from '@wordpress/components';

const RollbackPage = ({
	selectedSubscriptions,
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
	const [dryRunPage, setDryRunPage] = useState(1);
	const [testResultsOnGreen, setTestResultsOnGreen] = useState([]);
	const [dryRunCompleted, setDryRunCompleted] = useState(false); // Track if dry run is completed
	const perPage = window.wcpsm_migration_data.per_page * 1;

	// Reset state when user navigates back
	useEffect(() => {
		return () => {
			setTestResults([]);
			setTestResultsOnGreen([]);
			setProgress(0);
			setDryRunCompleted(false);
		};
	}, []);
	
	const handleDownloadCsv = () => {
		const url = `${window.wcpsm_migration_data.base_api}${window.wcpsm_migration_data.endpoints?.dry_download_rollback}?_wpnonce=${window.wcpsm_migration_data.nonce}`;

		window.location.href = url;
	};

	const handleTest = async () => {
		setIsProcessing(true);
		setIsLoading(true);
	
		const totalBatches = Math.ceil(selectedSubscriptions.length / perPage);
		setProgress((1 / totalBatches) * 100);
		let allResults = [];
	
		for (let page = 1; page <= totalBatches; page++) {
			setDryRunPage(page);
			const startIndex = (page - 1) * perPage;
			const subscriptionsBatch = selectedSubscriptions.slice(
				startIndex,
				startIndex + perPage
			);
	
			try {
				const response = await apiFetch({
					path: window.wcpsm_migration_data.endpoints?.dry_migrate_rollback,
					headers: {
						'X-WP-Nonce': window.wcpsm_migration_data.nonce,
					},
					method: 'POST',
					data: {
						subscriptions: subscriptionsBatch,
						page: page,
					},
				});
	
				// Append the result data to allResults
				allResults = [...allResults, ...response.data];
				setProgress(((page + 1) / totalBatches) * 100);
			} catch (error) {
				console.error('Error running test:', error);
			}
		}
	
		// Set results and filter those with success === true
		setTestResults(allResults);
		setTestResultsOnGreen(allResults.filter((res) => res.success === true));
		setDryRunCompleted(true); // Mark dry run as completed
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
			setDryRunPage(page);
			const startIndex = (page - 1) * perPage;
			const subscriptionsBatch = selectedSubscriptions.slice(
				startIndex,
				startIndex + perPage
			);

			try {
				const response = await apiFetch({
					path: wcpsm_migration_data.endpoints?.migrate_rollback,
					headers: {
						'X-WP-Nonce': wcpsm_migration_data.nonce,
					},
					method: 'POST',
					data: {
						subscriptions: subscriptionsBatch,
						finished: page === totalBatches,
					},
				});

				allResults = [...allResults, ...response.data];
				setProgress(((page + 1) / totalBatches) * 100);
			} catch (error) {
				console.error('Error running live rollback:', error);
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
			<h2>Test Rollback</h2>
			<p className="text-muted">
				We&apos;re ready for the rollback. We need to do a test run
				first to check for all the conditions, and if they are met, we
				can run the actual rollback.
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
																
								const statusText = result ? result.message : 'Pending test';
								
								const statusColor = result
									? result.success
										? result.warning
											? 'orange'
											: 'green'
										: 'red'
									: 'gray';
						
								const subscriptionName = result && typeof result.name === 'string' ? (
									result.permalink ? (
										<a href={result.permalink.replace(/&amp;/g, '&')} target="_blank" rel="noopener noreferrer">
											{result.name}
										</a>
									) : result.name
								) : subscription.name;
														
								return (
									<p
										key={index}
										style={{
											color: statusColor,
											opacity: result ? 1 : 0.5,
										}}
									>
										{subscriptionName} - {statusText}
									</p>
								);
							})}
						</div>
						<div className="page__checkbox_list_bottom">
							<hr />
							<p className="text-footer">
								Total rollbacks to process:{' '}
								{testResultsOnGreen.length}
							</p>
						</div>
					</div>
					<div className="wpsm-migration-page__pagination">
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
							onClick={() => {
								goToPreviousStep();
								setDryRunCompleted(false);
							}}
							disabled={isProcessing}
						>
							Previous
						</Button>
						{dryRunCompleted && (
							<Button
								variant="primary"
								onClick={handleDownloadCsv}
								disabled={isLoading || isProcessing}
								icon="download" // Icon for download
							>
								Download CSV
							</Button>
						)}
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
									!dryRunCompleted ||
									isLoading ||
									isProcessing ||
									testResultsOnGreen?.length == 0
								}
							>
								{isLoading ? <Spinner /> : 'Run Rollback'}
							</Button>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default RollbackPage;
