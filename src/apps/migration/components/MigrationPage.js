// components/MigrationPage.js
import React from 'react';
import apiFetch from '@wordpress/api-fetch';
import { Spinner } from '@wordpress/components';

const MigrationPage = ({ selectedSubscriptions, selectedOriginPayment, selectedDestinationPayment, testResults, setTestResults, goToNextStep, goToPreviousStep, setMigrationResults, isLoading, setIsLoading }) => {

    const handleTest = () => {
        setIsLoading(true);
        apiFetch({
            path: wcpsm_migration_data.endpoints?.dry_migrate,
            headers: {
                'X-WP-Nonce': wcpsm_migration_data.nonce,
            },
            method: 'POST',
            data: {
                selectedSubscriptions,
                selectedOriginPayment,
                selectedDestinationPayment,
            },
        })
        .then((response) => {
            // Assuming response.data is the array of subscription test results
            setTestResults(response.data);
        })
        .catch((error) => console.error('Error running test:', error))
        .finally(() => setIsLoading(false));
    };

    const handleRun = () => {
        setIsLoading(true);
        apiFetch({
            path: wcpsm_migration_data.endpoints?.migrate,
            headers: {
                'X-WP-Nonce': wcpsm_migration_data.nonce,
            },
            method: 'POST',
            data: {
                selectedSubscriptions,
                selectedOriginPayment,
                selectedDestinationPayment,
            },
        })
        .then((response) => {
            setMigrationResults(response.data);
            goToNextStep();
        })
        .catch((error) => console.error('Error running migration:', error))
        .finally(() => setIsLoading(false));
    };

    return (
        <div>
            <h2>Test Migration</h2>
            <button onClick={handleTest} disabled={isLoading}>
                {isLoading ? <Spinner /> : 'Test'}
            </button>
            <div>
                {selectedSubscriptions.length > 0 ? (
                    selectedSubscriptions.map((subscription, index) => {
                        // `subscription` now contains both `id` and `name`
                        const result = testResults.find(res => res.id === subscription.id);
                        const statusText = result ? result.message : "Pending test";
                        const statusColor = result ? (result.success ? 'green' : 'red') : 'gray';
                        const subscriptionName = result ? result.name : subscription.name;

                        return (
                            <p 
                                key={index} 
                                style={{ 
                                    color: statusColor, 
                                    opacity: result ? 1 : 0.5 // Grayed out if not tested yet
                                }}
                            >
                                {`${subscriptionName} - ${statusText}`}
                            </p>
                        );
                    })
                ) : (
                    <p>No subscriptions selected for migration</p>
                )}
            </div>
            <button onClick={goToPreviousStep}>Previous</button>
            <button onClick={handleRun} disabled={testResults.filter(res => res.success).length === 0 || isLoading}>
                {isLoading ? <Spinner /> : 'Run Migration'}
            </button>
        </div>
    );
};

export default MigrationPage;