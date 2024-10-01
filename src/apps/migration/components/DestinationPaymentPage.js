/**
 * External Dependencies
 */
import { List } from 'react-content-loader';

/**
 * WordPress Dependencies
 */
import { useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { Spinner, RadioControl, Button } from '@wordpress/components';

const DestinationPaymentPage = ({
	destinationPayments,
	setDestinationPayments,
	selectedDestinationPayment,
	setSelectedDestinationPayment,
	goToNextStep,
	goToPreviousStep,
	isLoading,
	setIsLoading,
}) => {
	useEffect(() => {
		setIsLoading(true);
		apiFetch({
			path: window.wcpsm_migration_data.endpoints
				?.get_destination_methods,
			headers: {
				'X-WP-Nonce': window.wcpsm_migration_data.nonce,
			},
		})
			.then((response) => setDestinationPayments(response.data))
			.catch((error) =>
				console.error('Error fetching destination payments:', error)
			)
			.finally(() => setIsLoading(false));
	}, []);

	return (
		<div className="wpsm-migration-page">
			<h2>Select Destination Payment Method</h2>
			<p className="text-muted">
				These are the payment methods that are available for the
				selected subscriptions to be transfered.
			</p>
			{isLoading ? (
				<>
					<List />
					<div className="wpsm-migration-page__actions">
						<Spinner />
					</div>
				</>
			) : (
				<>
					{destinationPayments.length > 0 ? (
						<>
							<div className="wpsm-migration-page__checkbox_list">
								<RadioControl
									label="Available Destination Payment Methods"
									selected={selectedDestinationPayment}
									options={destinationPayments.map(
										(payment) => ({
											label: payment.name,
											value: payment.id,
										})
									)}
									onChange={(value) =>
										setSelectedDestinationPayment(value)
									}
								/>
							</div>
							<div className="psm-migration-page__pagination"></div>
						</>
					) : (
						<p>No available destination payment methods</p>
					)}
					<div className="wpsm-migration-page__actions">
						<Button variant="secondary" onClick={goToPreviousStep}>
							Previous
						</Button>
						<Button
							variant="primary"
							onClick={goToNextStep}
							disabled={!selectedDestinationPayment}
						>
							Next
						</Button>
					</div>
				</>
			)}
		</div>
	);
};

export default DestinationPaymentPage;
