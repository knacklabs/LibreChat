import { AuthContextProvider } from '~/hooks/AuthContext';
import ShareView from '~/components/Share/ShareView';

export default function ShareRoute() {
  return (
    <AuthContextProvider>
      <ShareView />
    </AuthContextProvider>
  );
}
