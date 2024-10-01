/**
 * WordPress Dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Local Dependencies
 */
import OriginPaymentPage from './components/OriginPaymentPage';
import SubscriptionsPage from './components/SubscriptionsPage';
import DestinationPaymentPage from './components/DestinationPaymentPage';
import SubscriptionTokensPage from './components/SubscriptionTokensPage';
import MigrationPage from './components/MigrationPage';
import ResultsPage from './components/ResultsPage';
import './migration.scss';

const Migration = () => {
	const [step, setStep] = useState(1);
	const [originPayments, setOriginPayments] = useState([]);
	const [selectedOriginPayment, setSelectedOriginPayment] = useState(null);
	const [subscriptions, setSubscriptions] = useState([]);
	const [selectedSubscriptions, setSelectedSubscriptions] = useState([]); // Now an array of objects with id and name
	const [destinationPayments, setDestinationPayments] = useState([]);
	const [selectedDestinationPayment, setSelectedDestinationPayment] =
		useState(null);
	const [testResults, setTestResults] = useState([]);
	const [migrationResults, setMigrationResults] = useState([]);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (step === 1) {
			setIsLoading(true);
			apiFetch({
				path: window.wcpsm_migration_data.endpoints?.get_origin_methods,
				headers: {
					'X-WP-Nonce': window.wcpsm_migration_data.nonce,
				},
			})
				.then((response) => {
					setOriginPayments(response.data);
				})
				.catch((error) =>
					console.error('Error fetching origin payments:', error)
				)
				.finally(() => setIsLoading(false));
		}
	}, [step]);

	const goToNextStep = () => {
		setStep(step + 1);
	};

	const goToPreviousStep = () => {
		setStep(step - 1);
	};

	return (
		<div className="wpsm-migration-wrapper">
			{step === 1 && (
				<OriginPaymentPage
					originPayments={originPayments}
					selectedOriginPayment={selectedOriginPayment}
					setSelectedOriginPayment={setSelectedOriginPayment}
					goToNextStep={goToNextStep}
					isLoading={isLoading}
				/>
			)}
			{step === 2 && (
				<SubscriptionsPage
					selectedOriginPayment={selectedOriginPayment}
					subscriptions={subscriptions}
					setSubscriptions={setSubscriptions}
					selectedSubscriptions={selectedSubscriptions}
					setSelectedSubscriptions={setSelectedSubscriptions}
					goToNextStep={goToNextStep}
					goToPreviousStep={goToPreviousStep}
					isLoading={isLoading}
					setIsLoading={setIsLoading}
				/>
			)}
			{step === 3 && (
				<DestinationPaymentPage
					destinationPayments={destinationPayments}
					setDestinationPayments={setDestinationPayments}
					selectedDestinationPayment={selectedDestinationPayment}
					setSelectedDestinationPayment={
						setSelectedDestinationPayment
					}
					goToNextStep={goToNextStep}
					goToPreviousStep={goToPreviousStep}
					isLoading={isLoading}
					setIsLoading={setIsLoading}
				/>
			)}
			{step === 4 && (
				<SubscriptionTokensPage
					goToNextStep={goToNextStep}
					goToPreviousStep={goToPreviousStep}
					setIsLoading={setIsLoading}
				/>
			)}
			{step === 5 && (
				<MigrationPage
					selectedSubscriptions={selectedSubscriptions} // This now contains objects with id and name
					selectedOriginPayment={selectedOriginPayment}
					selectedDestinationPayment={selectedDestinationPayment}
					testResults={testResults}
					setTestResults={setTestResults}
					goToNextStep={goToNextStep}
					goToPreviousStep={goToPreviousStep}
					setMigrationResults={setMigrationResults}
					isLoading={isLoading}
					setIsLoading={setIsLoading}
				/>
			)}
			{step === 6 && <ResultsPage migrationResults={migrationResults} />}
		</div>
	);
};

export default Migration;
