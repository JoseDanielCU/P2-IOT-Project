import '../styles/globals.css';
import AlertBanner from '../src/components/AlertBanner';

function App({ Component, pageProps }) {
    return (
        <>
            <AlertBanner />
            <Component {...pageProps} />
        </>
    );
}

export default App;
