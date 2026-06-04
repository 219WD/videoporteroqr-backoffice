export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white" aria-hidden="true">
      <img
        src="/splash/logotipo-color.png"
        alt=""
        className="w-[240px] max-w-[72vw] select-none object-contain"
        draggable={false}
      />
    </div>
  );
}
