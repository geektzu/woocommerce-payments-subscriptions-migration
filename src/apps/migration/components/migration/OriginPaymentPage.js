/**
 * External Dependencies
 */
import { List } from 'react-content-loader';

/**
 * WordPress Dependencies
 */
import { Spinner, RadioControl, Button } from '@wordpress/components';

const OriginPaymentPage = ({
	originPayments,
	selectedOriginPayment,
	setSelectedOriginPayment,
	goToNextStep,
	isLoading,
	goBackToBase,
}) => {
	
	return (
		<div className="wpsm-migration-page">
			<h2>Select Origin Payment Method</h2>
			<p className="text-muted">
				These are the payment methods that are available for migrating.
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
					<div className="wpsm-migration-page__checkbox_list">
						{originPayments.length > 0 ? (
							<RadioControl
								label="Available Origin Payment Methods"
								selected={selectedOriginPayment}
								options={originPayments.map((payment) => ({
									label: (
										<>
											{payment.name}
											{payment?.description && (
												<span className="text-muted">
													{" "}
													{payment.description}
												</span>
											)}
										</>
									),
									value: payment.id,
								}))}
								onChange={(value) =>
									setSelectedOriginPayment(value)
								}
							/>
						) : (
							<p>No available origin payment methods</p>
						)}
					</div>
					<div className="psm-migration-page__pagination"></div>
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
							disabled={!selectedOriginPayment}
						>
							Next
						</Button>
					</div>
				</>
			)}
		</div>
	);
};

export default OriginPaymentPage;
