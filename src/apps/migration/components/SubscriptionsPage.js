import React, { useEffect } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { Spinner, CheckboxControl, Button } from '@wordpress/components';

const SubscriptionsPage = ({ selectedOriginPayment, subscriptions, setSubscriptions, selectedSubscriptions, setSelectedSubscriptions, goToNextStep, goToPreviousStep, isLoading, setIsLoading }) => {
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
            // Map each subscription to an object containing id and name
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
                            {subscriptions.map(subscription => (
                                <CheckboxControl
                                    key={subscription.id}
                                    label={subscription.name}
                                    checked={selectedSubscriptions.some(sub => sub.id === subscription.id)}
                                    onChange={() => handleCheckboxChange(subscription)}
                                />
                            ))}
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
