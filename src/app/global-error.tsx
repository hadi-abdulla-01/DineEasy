'use client';

/**
 * Last-resort error boundary (replaces the root layout when the root layout itself fails).
 * Uses inline styles only because global CSS may not be available here.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <html lang="en">
            <body
                style={{
                    margin: 0,
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f8f9fb',
                    color: '#2b303b',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    textAlign: 'center',
                    padding: '24px',
                }}
            >
                <div style={{ maxWidth: '320px' }}>
                    <h1 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 8px' }}>Something went wrong</h1>
                    <p style={{ margin: '0 0 16px', fontSize: '15px', color: '#667085' }}>
                        We couldn&apos;t load this page. Please try again.
                    </p>
                    {error?.digest && <p style={{ fontSize: '12px', color: '#98a2b3' }}>Reference: {error.digest}</p>}
                    <button
                        onClick={() => reset()}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#f0415f',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '15px',
                        }}
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
