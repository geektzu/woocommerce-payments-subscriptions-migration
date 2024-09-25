import React from 'react';
import { Spinner } from '@wordpress/components';

const OriginPaymentPage = ({ originPayments, selectedOriginPayment, setSelectedOriginPayment, goToNextStep, isLoading }) => {
    return (
        <div>
            <h2>Select Origin Payment Method</h2>
            {isLoading ? (
                <Spinner />
            ) : (
                <>
                    {originPayments.length > 0 ? (
                        originPayments.map((payment, index) => (
                            <label key={index}>
                                <input
                                    type="radio"
                                    value={payment.id}
                                    checked={selectedOriginPayment === payment.id}
                                    onChange={() => setSelectedOriginPayment(payment.id)}
                                />
                                {payment.name}
                            </label>
                        ))
                    ) : (
                        <p>No available origin payment methods</p>
                    )}
                    <button onClick={goToNextStep} disabled={!selectedOriginPayment}>Next</button>
                </>
            )}
        </div>
    );
};

export default OriginPaymentPage;