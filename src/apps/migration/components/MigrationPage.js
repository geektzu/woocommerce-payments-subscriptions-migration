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
        .then((response) => setTestResults(response.data))
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
            {isLoading ? (
                <Spinner />
            ) : (
                <>
                    <button onClick={handleTest}>Test</button>
                    <div>
                        {testResults.map((result, index) => (
                            <p key={index} style={{ color: result.success ? 'green' : 'red' }}>
                                {result.subscription}: {result.message}
                            </p>
                        ))}
                    </div>
                    <button onClick={goToPreviousStep}>Previous</button>
                    <button onClick={handleRun} disabled={testResults.filter(res => res.success).length === 0}>Run Migration</button>
                </>
            )}
        </div>
    );
};

export default MigrationPage;