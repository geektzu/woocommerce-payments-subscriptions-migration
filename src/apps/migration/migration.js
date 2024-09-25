import React, { useState, useEffect } from 'react';
import apiFetch from '@wordpress/api-fetch';
import OriginPaymentPage from './components/OriginPaymentPage';
import SubscriptionsPage from './components/SubscriptionsPage';
import DestinationPaymentPage from './components/DestinationPaymentPage';
import MigrationPage from './components/MigrationPage';
import ResultsPage from './components/ResultsPage';
import './migration.scss';

const Migration = () => {
    const [step, setStep] = useState(1);
    const [originPayments, setOriginPayments] = useState([]);
    const [selectedOriginPayment, setSelectedOriginPayment] = useState(null);
    const [subscriptions, setSubscriptions] = useState([]);
    const [selectedSubscriptions, setSelectedSubscriptions] = useState([]);
    const [destinationPayments, setDestinationPayments] = useState([]);
    const [selectedDestinationPayment, setSelectedDestinationPayment] = useState(null);
    const [testResults, setTestResults] = useState([]);
    const [migrationResults, setMigrationResults] = useState([]);

    useEffect(() => {
        if (step === 1) {
            // Fetch origin payment methods
            apiFetch({ 
                path: wcpsm_migration_data.endpoints?.get_origin_methods,
                headers: {
                    'X-WP-Nonce': wcpsm_migration_data.nonce,
                },
            })
            .then((response) => {
                setOriginPayments(response.data);
            })
            .catch((error) => console.error('Error fetching origin payments:', error));
        }
    }, [step]);

    const goToNextStep = () => {
        setStep(step + 1);
    };

    const goToPreviousStep = () => {
        setStep(step - 1);
    };

    return (
        <div>
            {step === 1 && (
                <OriginPaymentPage 
                    originPayments={originPayments}
                    selectedOriginPayment={selectedOriginPayment}
                    setSelectedOriginPayment={setSelectedOriginPayment}
                    goToNextStep={goToNextStep}
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
                />
            )}
            {step === 3 && (
                <DestinationPaymentPage 
                    destinationPayments={destinationPayments}
                    setDestinationPayments={setDestinationPayments}
                    selectedDestinationPayment={selectedDestinationPayment}
                    setSelectedDestinationPayment={setSelectedDestinationPayment}
                    goToNextStep={goToNextStep}
                    goToPreviousStep={goToPreviousStep}
                />
            )}
            {step === 4 && (
                <MigrationPage 
                    selectedSubscriptions={selectedSubscriptions}
                    selectedOriginPayment={selectedOriginPayment}
                    selectedDestinationPayment={selectedDestinationPayment}
                    testResults={testResults}
                    setTestResults={setTestResults}
                    goToNextStep={goToNextStep}
                    goToPreviousStep={goToPreviousStep}
                    setMigrationResults={setMigrationResults}
                />
            )}
            {step === 5 && (
                <ResultsPage migrationResults={migrationResults} />
            )}
        </div>
    );
};

export default Migration;