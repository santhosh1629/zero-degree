import React, { useState, useEffect } from 'react';
import { verifyQrCodeAndCollectOrder } from '../../services/mockApi';
import type { Order } from '../../types';
import { useAuth } from '../../context/AuthContext';

declare const Html5QrcodeScanner: any;

const ScanQrPage: React.FC = () => {
    const { user } = useAuth();
    const [scanResult, setScanResult] = useState<'idle' | 'success' | 'error'>('idle');
    const [scannedOrder, setScannedOrder] = useState<Order | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        if (scanResult !== 'idle') {
            return;
        }

        const html5QrcodeScanner = new Html5QrcodeScanner(
            'qr-reader-container',
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
        );

        const onScanSuccess = (decodedText: string) => {
            html5QrcodeScanner.clear();
            handleVerifyQrCode(decodedText);
        };

        const onScanFailure = (error: string) => {};

        html5QrcodeScanner.render(onScanSuccess, onScanFailure);

        return () => {
            if (html5QrcodeScanner && typeof html5QrcodeScanner.clear === 'function') {
                try {
                    html5QrcodeScanner.clear();
                } catch(err) {
                    console.error("Failed to clear QR scanner.", err);
                }
            }
        };
    }, [scanResult]);

    const handleVerifyQrCode = async (qrCodeData: string) => {
        setIsVerifying(true);
        if (!user) {
            setErrorMessage('User not authenticated. Please log in again.');
            setScanResult('error');
            setIsVerifying(false);
            return;
        }
        try {
            const order = await verifyQrCodeAndCollectOrder(qrCodeData, user.id);
            setScannedOrder(order);
            setScanResult('success');
        } catch (err) {
            setErrorMessage((err as Error).message);
            setScannedOrder(null);
            setScanResult('error');
        } finally {
            setIsVerifying(false);
        }
    };
    
    const handleReset = () => {
        setScanResult('idle');
        setScannedOrder(null);
        setErrorMessage('');
    };

    const renderScanner = () => (
        <div className="w-full text-center">
            {isVerifying ? (
                 <div>
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                    <p className="text-lg font-semibold text-indigo-400">Verifying Order...</p>
                </div>
            ) : (
                <>
                    <div id="qr-reader-container" className="w-full max-w-sm mx-auto aspect-square rounded-lg mb-4 border-2 border-dashed border-gray-600 overflow-hidden"></div>
                    <p className="text-center text-gray-400">
                        Point your camera at the customer's QR code.
                    </p>
                </>
            )}
        </div>
    );

    const renderSuccessState = () => (
        <div className="text-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-green-400 mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <h2 className="text-3xl font-bold text-green-300 mb-2">Order Confirmed ✅</h2>
            {scannedOrder && (
                <div className="text-left bg-gray-700/50 p-4 rounded-lg mt-6 text-gray-200">
                    <p><strong>Order ID:</strong> ...{scannedOrder.id.slice(-8)}</p>
                    <p><strong>Customer:</strong> {scannedOrder.studentName}</p>
                    <p><strong>Items:</strong></p>
                    <ul className="list-disc list-inside ml-4">
                        {scannedOrder.items.map(item => <li key={item.id}>{item.name} x {item.quantity}</li>)}
                    </ul>
                    <p className="font-bold mt-2">Total: ₹{scannedOrder.totalAmount.toFixed(2)}</p>
                </div>
            )}
            <button onClick={handleReset} className="w-full mt-6 bg-gray-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors">
                Scan Another QR Code
            </button>
        </div>
    );

    const renderErrorState = () => (
        <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-red-400 mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <h2 className="text-3xl font-bold text-red-400 mb-2">Invalid Order ❌</h2>
            <p className="text-red-300 bg-red-500/20 p-3 rounded-md">{errorMessage}</p>
            <button onClick={handleReset} className="w-full mt-6 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
                Try Again
            </button>
        </div>
    );

    return (
        <div className="max-w-md mx-auto bg-gray-800 p-8 rounded-lg shadow-md border border-gray-700">
            <h1 className="text-3xl font-bold mb-6 text-center text-white">Scan & Verify Order</h1>
            <div className="flex items-center justify-center min-h-[350px]">
                {scanResult === 'idle' && renderScanner()}
                {scanResult === 'success' && renderSuccessState()}
                {scanResult === 'error' && renderErrorState()}
            </div>
        </div>
    );
};

export default ScanQrPage;