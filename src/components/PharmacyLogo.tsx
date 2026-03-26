import logoImg from '@/assets/pharmacy-logo.png';

const PharmacyLogo = () => (
  <div className="w-[46px] h-[46px] shrink-0 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center p-0.5">
    <img src={logoImg} alt="Madalena Bal Farmácia" className="w-full h-full object-contain" />
  </div>
);

export default PharmacyLogo;
