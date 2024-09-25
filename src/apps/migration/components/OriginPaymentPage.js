import React from 'react';

const OriginPaymentPage = ({ originPayments, selectedOriginPayment, setSelectedOriginPayment, goToNextStep }) => {
    return (
        <div>
            <h2>Select Origin Payment Method</h2>
            {originPayments.length > 0 ? originPayments.map((payment, index) => (
                <label key={index}>
                    <input
                        type="radio"
                        value={payment.id}
                        checked={selectedOriginPayment === payment.id}
                        onChange={() => setSelectedOriginPayment(payment.id)}
                    />
                    {payment.name}
                </label>
            )) : <p>Loading payment methods...</p>}
            <button onClick={goToNextStep} disabled={!selectedOriginPayment}>Next</button>
        </div>
    );
};

export default OriginPaymentPage;