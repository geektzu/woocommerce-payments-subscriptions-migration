import React, { useEffect, useState } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { Spinner, CheckboxControl, Button } from '@wordpress/components';

const SubscriptionsPage = ({ selectedOriginPayment, subscriptions, setSubscriptions, selectedSubscriptions, setSelectedSubscriptions, goToNextStep, goToPreviousStep, isLoading, setIsLoading }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = wcpsm_migration_data.per_page * 1;

    useEffect(() => {
        if (selectedOriginPayment) {
            setIsLoading(true);
            apiFetch({ 
                path: `${wcpsm_migration_data.endpoints?.get_subscriptions}?origin_pm=${selectedOriginPayment}`,
                headers: {
                    'X-WP-Nonce': wcpsm_migration_data.nonce,
                }
            })
            .then((response) => setSubscriptions(response.data))
            .catch((error) => console.error('Error fetching subscriptions:', error))
            .finally(() => setIsLoading(false));
        }
    }, [selectedOriginPayment]);

    const handleSelectAll = () => {
        if (selectedSubscriptions.length === subscriptions.length) {
            setSelectedSubscriptions([]);
        } else {
            setSelectedSubscriptions(subscriptions.map(sub => ({ id: sub.id, name: sub.name })));
        }
    };

    const handleCheckboxChange = (subscription) => {
        const exists = selectedSubscriptions.find(sub => sub.id === subscription.id);
        if (exists) {
            setSelectedSubscriptions(selectedSubscriptions.filter(sub => sub.id !== subscription.id));
        } else {
            setSelectedSubscriptions([...selectedSubscriptions, { id: subscription.id, name: subscription.name }]);
        }
    };

    // Calculate subscriptions to display on the current page
    const startIndex = (currentPage - 1) * perPage;
    const currentSubscriptions = subscriptions.slice(startIndex, startIndex + perPage);

    // Handle pagination
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
        <div>
            <h2>Select Subscriptions</h2>
            {isLoading ? (
                <Spinner />
            ) : (
                <>
                    {subscriptions.length > 0 ? (
                        <>
                            <CheckboxControl
                                label="Select All"
                                checked={selectedSubscriptions.length === subscriptions.length}
                                onChange={handleSelectAll}
                            />
                            {currentSubscriptions.map(subscription => (
                                <CheckboxControl
                                    key={subscription.id}
                                    label={subscription.name}
                                    checked={selectedSubscriptions.some(sub => sub.id === subscription.id)}
                                    onChange={() => handleCheckboxChange(subscription)}
                                />
                            ))}
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
                        <p>No subscriptions with {selectedOriginPayment}</p>
                    )}
                    <Button className="button button-secondary" onClick={goToPreviousStep}>Previous</Button>
                    <Button className="button button-primary" onClick={goToNextStep} disabled={selectedSubscriptions.length === 0}>Next</Button>
                </>
            )}
        </div>
    );
};

export default SubscriptionsPage;