import React, { useState } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { Spinner, Button } from '@wordpress/components';

const MigrationPage = ({ selectedSubscriptions, selectedOriginPayment, selectedDestinationPayment, testResults, setTestResults, goToNextStep, goToPreviousStep, setMigrationResults, isLoading, setIsLoading }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = wcpsm_migration_data.per_page * 1; // Ensure it's treated as a number

    const handleTest = () => {
        setIsLoading(true);
        apiFetch({
            path: wcpsm_migration_data.endpoints?.dry_migrate,
            headers: {
                'X-WP-Nonce': wcpsm_migration_data.nonce,
            },
            method: 'POST',
            data: {
                subscriptions: selectedSubscriptions,
                origin_pm: selectedOriginPayment,
                destination_pm: selectedDestinationPayment,
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
                subscriptions: selectedSubscriptions,
                origin_pm: selectedOriginPayment,
                destination_pm: selectedDestinationPayment,
            },
        })
        .then((response) => {
            setMigrationResults(response.data);
            goToNextStep();
        })
        .catch((error) => console.error('Error running migration:', error))
        .finally(() => setIsLoading(false));
    };

    // Calculate subscriptions to display on the current page
    const startIndex = (currentPage - 1) * perPage;
    const currentSubscriptions = selectedSubscriptions.slice(startIndex, startIndex + perPage);

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
        <div>
            <h2>Test Migration</h2>
            <Button className="button button-tertiary" onClick={handleTest} disabled={isLoading}>
                {isLoading ? <Spinner /> : 'Test'}
            </Button>
            <div>
                {selectedSubscriptions.length > 0 ? (
                    <>
                        {currentSubscriptions.map((subscription, index) => {
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
                        })}
                        {/* Pagination controls */}
                        <div className="pagination-controls">
                            <Button 
                                isSecondary 
                                onClick={goToPreviousPage} 
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <span>Page {currentPage} of {totalPages}</span>
                            <Button 
                                isSecondary 
                                onClick={goToNextPage} 
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </>
                ) : (
                    <p>No subscriptions selected for migration</p>
                )}
            </div>
            <Button className="button button-secondary" onClick={goToPreviousStep}>Previous</Button>
            <Button className="button button-primary" onClick={handleRun} disabled={testResults.filter(res => res.success).length === 0 || isLoading}>
                {isLoading ? <Spinner /> : 'Run Migration'}
            </Button>
        </div>
    );
};

export default MigrationPage;
