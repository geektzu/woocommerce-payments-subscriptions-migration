import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import SubscriptionsPage from './SubscriptionsPage';
import SubscriptionTokensPage from './SubscriptionTokensPage';
import RollbackPage from './RollbackPage';
import ResultsPage from './ResultsPage';

const Rollback = ({ goBackToBase }) => {
	const [step, setStep] = useState(1);
	const [subscriptions, setSubscriptions] = useState([]);
	const [selectedSubscriptions, setSelectedSubscriptions] = useState([]);
	const [testResults, setTestResults] = useState([]);
	const [rollbackResults, setRollbackResults] = useState([]);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (step === 1) {
			setIsLoading(true);
			apiFetch({
				path: window.wcpsm_migration_data.endpoints?.get_subscriptions_rollback,
				headers: {
					'X-WP-Nonce': window.wcpsm_migration_data.nonce,
				},
			})
				.then((response) => {
					setSubscriptions(response.data);
				})
				.catch((error) =>
					console.error('Error fetching rollback subscriptions:', error)
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
		<>
			{step === 1 && (
				<SubscriptionsPage
					subscriptions={subscriptions}
					selectedSubscriptions={selectedSubscriptions}
					setSelectedSubscriptions={setSelectedSubscriptions}
					goToNextStep={goToNextStep}
					isLoading={isLoading}
					setIsLoading={setIsLoading}
					goBackToBase={goBackToBase}
				/>
			)}
			{step === 2 && (
				<SubscriptionTokensPage
					goToNextStep={goToNextStep}
					goToPreviousStep={goToPreviousStep}
					setIsLoading={setIsLoading}
				/>
			)}
			{step === 3 && (
				<RollbackPage
					selectedSubscriptions={selectedSubscriptions}
					testResults={testResults}
					setTestResults={setTestResults}
					goToNextStep={goToNextStep}
					goToPreviousStep={goToPreviousStep}
					setRollbackResults={setRollbackResults}
					isLoading={isLoading}
					setIsLoading={setIsLoading}
				/>
			)}
			{step === 4 && <ResultsPage migrationResults={rollbackResults} />}
		</>
	);
};

export default Rollback;