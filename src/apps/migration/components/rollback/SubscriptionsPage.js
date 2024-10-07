import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { Spinner, CheckboxControl, Button } from '@wordpress/components';

const SubscriptionsPage = ({
	subscriptions,
	selectedSubscriptions,
	setSelectedSubscriptions,
	goToNextStep,
	goToPreviousStep,
	isLoading,
	setIsLoading,
	goBackToBase,
}) => {
	const [currentPage, setCurrentPage] = useState(1);
	const perPage = window.wcpsm_migration_data.per_page * 1;

	useEffect(() => {
		if (subscriptions.length === 0) {
			setIsLoading(true);
			apiFetch({
				path: `${window.wcpsm_migration_data.endpoints?.get_subscriptions_rollback}`,
				headers: {
					'X-WP-Nonce': window.wcpsm_migration_data.nonce,
				},
			})
				.then((response) => setSelectedSubscriptions(response.data))
				.catch((error) =>
					console.error('Error fetching rollback subscriptions:', error)
				)
				.finally(() => setIsLoading(false));
		}
	}, []);

	const handleSelectAll = () => {
		if (selectedSubscriptions.length === subscriptions.length) {
			setSelectedSubscriptions([]);
		} else {
			setSelectedSubscriptions(
				subscriptions.map((sub) => ({ id: sub.id, name: sub.name }))
			);
		}
	};

	const handleCheckboxChange = (subscription) => {
		const exists = selectedSubscriptions.find(
			(sub) => sub.id === subscription.id
		);
		if (exists) {
			setSelectedSubscriptions(
				selectedSubscriptions.filter(
					(sub) => sub.id !== subscription.id
				)
			);
		} else {
			setSelectedSubscriptions([
				...selectedSubscriptions,
				{ id: subscription.id, name: subscription.name },
			]);
		}
	};

	const startIndex = (currentPage - 1) * perPage;
	const currentSubscriptions = subscriptions.slice(
		startIndex,
		startIndex + perPage
	);

	const totalPages = Math.ceil(subscriptions.length / perPage);

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
			<h2>Select Subscriptions for Rollback</h2>
			<p className="text-muted">
				These are the subscriptions available for rollback.
			</p>
			{isLoading ? (
				<Spinner />
			) : (
				<>
					{subscriptions.length > 0 ? (
						<>
							<div className="wpsm-migration-page__checkbox_list">
								<div className="wpsm-migration-page__checkbox_list_top">
									<CheckboxControl
										label="Select All"
										checked={
											selectedSubscriptions.length ===
											subscriptions.length
										}
										onChange={handleSelectAll}
									/>
									<hr />
								</div>
								<div className="wpsm-migration-page__checkbox_list_middle">
									{currentSubscriptions.map((subscription) => (
										<CheckboxControl
											key={subscription.id}
											label={subscription.name}
											checked={selectedSubscriptions.some(
												(sub) => sub.id === subscription.id
											)}
											onChange={() =>
												handleCheckboxChange(subscription)
											}
										/>
									))}
								</div>
								<div className="wpsm-migration-page__checkbox_list_bottom">
									<hr />
									<p className="text-footer">
										Total subscriptions:{' '}
										{selectedSubscriptions.length} /{' '}
										{subscriptions.length}
									</p>
								</div>
							</div>
							<div className="wpsm-migration-page__pagination">
								<Button
									variant="link"
									onClick={goToPreviousPage}
									disabled={currentPage === 1}
								>
									Previous
								</Button>
								<span>
									Page {currentPage} of {totalPages}
								</span>
								<Button
									variant="link"
									onClick={goToNextPage}
									disabled={currentPage === totalPages}
								>
									Next
								</Button>
							</div>
						</>
					) : (
						<p>No subscriptions available for rollback.</p>
					)}
					<div className="wpsm-migration-page__actions">
						<Button
							variant="secondary"
							onClick={goBackToBase}
						>
							Previous
						</Button>
						<Button
							variant="primary"
							onClick={goToNextStep}
							disabled={selectedSubscriptions.length === 0}
						>
							Next
						</Button>
					</div>
				</>
			)}
		</div>
	);
};

export default SubscriptionsPage;