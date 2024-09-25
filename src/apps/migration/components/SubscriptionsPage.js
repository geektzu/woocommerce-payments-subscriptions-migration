import React, { useEffect } from 'react';
import apiFetch from '@wordpress/api-fetch';

const SubscriptionsPage = ({ selectedOriginPayment, subscriptions, setSubscriptions, selectedSubscriptions, setSelectedSubscriptions, goToNextStep, goToPreviousStep }) => {
    useEffect(() => {
        apiFetch({ 
            path: wcpsm_migration_data.endpoints?.get_subscriptions,
            headers: {
                'X-WP-Nonce': wcpsm_migration_data.nonce,
            }
        })
        .then((response) => setSubscriptions(response.data))
        .catch((error) => console.error('Error fetching subscriptions:', error));
    }, [selectedOriginPayment]);

    const handleSelectAll = () => {
        if (selectedSubscriptions.length === subscriptions.length) {
            setSelectedSubscriptions([]);
        } else {
            setSelectedSubscriptions(subscriptions.map(sub => sub.id));
        }
    };

    const handleCheckboxChange = (subscriptionId) => {
        if (selectedSubscriptions.includes(subscriptionId)) {
            setSelectedSubscriptions(selectedSubscriptions.filter(id => id !== subscriptionId));
        } else {
            setSelectedSubscriptions([...selectedSubscriptions, subscriptionId]);
        }
    };

    return (
        <div>
            <h2>Select Subscriptions</h2>
            <label>
                <input
                    type="checkbox"
                    checked={selectedSubscriptions.length === subscriptions.length}
                    onChange={handleSelectAll}
                />
                Select All
            </label>
            {subscriptions.map(subscription => (
                <label key={subscription.id}>
                    <input
                        type="checkbox"
                        checked={selectedSubscriptions.includes(subscription.id)}
                        onChange={() => handleCheckboxChange(subscription.id)}
                    />
                    {subscription.name}
                </label>
            ))}
            <button onClick={goToPreviousStep}>Previous</button>
            <button onClick={goToNextStep} disabled={selectedSubscriptions.length === 0}>Next</button>
        </div>
    );
};

export default SubscriptionsPage;