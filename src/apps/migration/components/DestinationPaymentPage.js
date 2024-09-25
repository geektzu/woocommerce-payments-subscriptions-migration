import React, { useEffect } from 'react';
import apiFetch from '@wordpress/api-fetch';

const DestinationPaymentPage = ({ destinationPayments, setDestinationPayments, selectedDestinationPayment, setSelectedDestinationPayment, goToNextStep, goToPreviousStep }) => {
    useEffect(() => {
        apiFetch({ 
            path: wcpsm_migration_data.endpoints?.get_destination_methods,
            headers: {
                'X-WP-Nonce': wcpsm_migration_data.nonce,
            }
        })
        .then((response) => setDestinationPayments(response.data))
        .catch((error) => console.error('Error fetching destination payments:', error));
    }, []);

    return (
        <div>
            <h2>Select Destination Payment Method</h2>
            {destinationPayments.length > 0 ? destinationPayments.map((payment, index) => (
                <label key={index}>
                    <input
                        type="radio"
                        value={payment.id}
                        checked={selectedDestinationPayment === payment.id}
                        onChange={() => setSelectedDestinationPayment(payment.id)}
                    />
                    {payment.name}
                </label>
            )) : <p>Loading payment methods...</p>}
            <button onClick={goToPreviousStep}>Previous</button>
            <button onClick={goToNextStep} disabled={!selectedDestinationPayment}>Next</button>
        </div>
    );
};

export default DestinationPaymentPage;