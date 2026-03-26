import logoImg from '@/assets/logo-madalena.png';

const PharmacyLogo = ({ size = 46 }: { size?: number }) => (
  <img
    src={logoImg}
    alt="Madalena Bal Farmácia"
    className="shrink-0 object-contain rounded-lg"
    style={{ width: size, height: size }}
  />
);

export default PharmacyLogo;
