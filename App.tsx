
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { INITIAL_ITEMS, TON_ICON } from './constants';
import { StickerItem, PageType, UserState } from './types';

const TgsPlayer = 'tgs-player' as any;

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('shop');
  const [profileView, setProfileView] = useState<'main' | 'inventory'>('main');
  const [activeTab, setActiveTab] = useState<'all' | 'gifts' | 'packs'>('all');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserState>({
    balance: 0.00,
    inventory: [],
    username: '@username'
  });
  
  const [selectedItem, setSelectedItem] = useState<StickerItem | null>(null);
  const [confirmingPurchase, setConfirmingPurchase] = useState<StickerItem | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [sortType, setSortType] = useState<'default' | 'priceAsc' | 'priceDesc' | 'nameAsc'>('default');
  const [showPromo, setShowPromo] = useState(false);
  const [promoCode, setPromoCode] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
        tg.headerColor = '#1a1a1a';
        const tgUser = tg.initDataUnsafe?.user;
        if (tgUser) {
          const rawUsername = tgUser.username || tgUser.first_name || 'username';
          setUser(prev => ({
            ...prev,
            username: rawUsername.startsWith('@') ? rawUsername : `@${rawUsername}`,
            photo_url: tgUser.photo_url
          }));
        }
      }
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const showToastMsg = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const sortedItems = useMemo(() => {
    let result = [...INITIAL_ITEMS];
    if (sortType === 'priceAsc') result.sort((a, b) => a.price - b.price);
    else if (sortType === 'priceDesc') result.sort((a, b) => b.price - a.price);
    else if (sortType === 'nameAsc') result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [sortType]);

  const handleBuy = useCallback((item: StickerItem) => {
    if (user.balance < item.price) {
      showToastMsg('❌ Недостаточно TON', 'error');
      return;
    }
    setUser(prev => ({
      ...prev,
      balance: prev.balance - item.price,
      inventory: [...prev.inventory, { ...item, boughtAt: Date.now() }]
    }));
    setConfirmingPurchase(null);
    setSelectedItem(null);
    showToastMsg(`✅ Куплено: ${item.name}!`);
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
  }, [user.balance, showToastMsg]);

  const applyPromo = () => {
    if (promoCode.trim() === 'itsaliyev67') {
      setUser(prev => ({ ...prev, balance: prev.balance + 67.00 }));
      showToastMsg('✅ +67.00 TON!');
      setShowPromo(false);
      setPromoCode('');
    } else {
      showToastMsg('❌ Неверный код', 'error');
    }
  };

  const isItemOwned = (id: number) => user.inventory.some(i => i.id === id);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#000000] z-[9999] flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#00b8d4] border-t-transparent rounded-full animate-spin-custom"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white pb-[80px] flex flex-col overflow-x-hidden font-sans">
      
      {currentPage !== 'profile' && (
        <header className="sticky top-0 z-40 bg-[#1a1a1a]/80 backdrop-blur-md px-4 py-4 flex justify-between items-center border-b border-white/5">
          <h1 className="text-xl font-bold tracking-tight">
            {currentPage === 'shop' ? 'Магазин' : currentPage === 'pvp' ? 'PvP Игры' : 'Solo'}
          </h1>
          <div className="flex items-center gap-2 bg-[#2a2a2a] px-3 py-1.5 rounded-full border border-white/10">
            <img src={TON_ICON} alt="TON" className="w-4 h-4" />
            <span className="text-sm font-bold">{user.balance.toFixed(2)}</span>
            <button onClick={() => setShowPromo(true)} className="ml-1 w-5 h-5 flex items-center justify-center bg-[#00b8d4] rounded-full text-white text-xs font-bold">+</button>
          </div>
        </header>
      )}

      {currentPage === 'profile' && profileView === 'main' && (
         <header className="px-4 pt-6 pb-2">
            <h1 className="text-2xl font-bold">Профиль</h1>
         </header>
      )}

      <main className="flex-1">
        {currentPage === 'shop' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex px-4 gap-6 bg-[#000000] sticky top-[68px] z-30">
              <div className="py-4 text-sm text-white border-b-2 border-[#00b8d4] font-bold">Гифты</div>
              <div className="py-4 text-sm text-gray-500 font-medium opacity-50 cursor-not-allowed">Лутпаки</div>
            </div>
            
            <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar">
              {[
                { label: 'Все', type: 'default' },
                { label: 'Дешевле', type: 'priceAsc' },
                { label: 'Дороже', type: 'priceDesc' }
              ].map(f => (
                <button 
                  key={f.type}
                  onClick={() => setSortType(f.type as any)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${sortType === f.type ? 'bg-[#00b8d4] text-white shadow-lg shadow-[#00b8d4]/20' : 'bg-[#1a1a1a] text-gray-400'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 px-4 pb-6">
              {sortedItems.map(item => (
                <div key={item.id} onClick={() => setSelectedItem(item)} className="bg-[#1a1a1a] rounded-2xl overflow-hidden active:scale-95 transition-all border border-white/5">
                  <div className="aspect-square flex items-center justify-center bg-white/5 p-2">
                    <TgsPlayer src={item.tgs} loop={false} speed="0.9" style={{ width: '85%', height: '85%' }} />
                  </div>
                  <div className="p-2.5 flex flex-col gap-1.5">
                    <div className="text-[10px] font-bold truncate opacity-90">{item.name}</div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setConfirmingPurchase(item); }}
                      className="bg-[#00b8d4] py-1.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 shadow-md active:bg-[#0097a7]"
                    >
                      {item.price.toFixed(2)} <img src={TON_ICON} className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentPage === 'pvp' && (
          <div className="p-4 flex flex-col gap-4 animate-in slide-in-from-right-4 duration-500">
            <div className="bg-[#1a1a1a] rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
              <div className="h-48 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80')] bg-center bg-cover relative">
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/40 to-transparent flex flex-col justify-end p-5">
                  <h3 className="text-[#00ffea] text-2xl font-black">Ice Arena</h3>
                  <p className="text-gray-300 text-xs mt-1">Битва на ледяных гифтах</p>
                </div>
              </div>
              <div className="p-4 flex justify-between items-center">
                <div className="text-xs text-gray-500 font-bold">Онлайн: 42 игрока</div>
                <button className="bg-[#00b8d4] text-white px-8 py-2.5 rounded-2xl font-black shadow-lg shadow-[#00b8d4]/30 active:scale-95 transition-transform">Вход</button>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'profile' && profileView === 'main' && (
          <div className="px-4 py-2 flex flex-col gap-4 animate-in fade-in duration-500">
            <div className="bg-gradient-to-br from-[#2d5a52] to-[#1a1a1a] rounded-[32px] p-6 flex flex-col items-center border border-white/10 shadow-2xl">
              <span className="text-white/60 text-xs font-bold mb-1">Игровой баланс</span>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-5xl font-extrabold">{user.balance.toFixed(2)}</span>
                <img src={TON_ICON} className="w-10 h-10" />
              </div>
              <div className="flex w-full gap-3">
                <button onClick={() => setShowPromo(true)} className="flex-1 bg-white/10 backdrop-blur-md py-4 rounded-2xl text-xs font-bold active:scale-95 transition-transform">Ввести промокод</button>
                <button className="flex-1 bg-white/10 backdrop-blur-md py-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
                  <span>🎁</span> Подарить гифт
                </button>
              </div>
            </div>

            <div className="bg-[#1a1a1a] rounded-2xl p-4 flex items-center gap-4 border border-white/5">
              <div className="w-12 h-12 bg-gradient-to-br from-[#00b8d4] to-[#2d5a52] rounded-full flex items-center justify-center overflow-hidden">
                {user.photo_url ? (
                  <img src={user.photo_url} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-black text-white/40">{user.username.charAt(1).toUpperCase()}</span>
                )}
              </div>
              <span className="font-bold text-lg">{user.username}</span>
            </div>

            <div className="bg-[#111111] rounded-3xl p-6 border border-white/5">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-extrabold">Мой Инвентарь</h2>
                <div className="text-gray-500 text-xs font-bold">{user.inventory.length} Айтемов •</div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {user.inventory.slice(0, 2).map((item, idx) => (
                   <div key={idx} onClick={() => { setProfileView('inventory'); setSelectedItem(item); }} className="aspect-square bg-[#1a1a1a] rounded-3xl flex items-center justify-center p-3 border border-white/5 active:scale-95 transition-all">
                      <TgsPlayer src={item.tgs} loop={false} style={{ width: '80%', height: '80%' }} />
                   </div>
                ))}
                {Array.from({ length: Math.max(0, 2 - user.inventory.length) }).map((_, i) => (
                  <div key={`pad-${i}`} className="aspect-square bg-[#1a1a1a] rounded-3xl flex items-center justify-center p-3 border border-white/5 opacity-40">
                    <div className="w-10 h-10 bg-white/5 rounded-lg" />
                  </div>
                ))}
                
                <button 
                  onClick={() => setProfileView('inventory')}
                  className="aspect-square bg-[#1a1a1a] rounded-3xl flex flex-col items-center justify-center gap-2 border border-white/5 active:scale-95 transition-all"
                >
                  <div className="grid grid-cols-2 gap-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                  <span className="text-[10px] font-bold text-white uppercase">Все Айтемы</span>
                </button>
              </div>
              
              {user.inventory.length === 0 && (
                <div className="mt-6 text-sm font-bold text-[#00b8d4] animate-pulse">У тебя пока нет айтемов.</div>
              )}
            </div>
          </div>
        )}

        {currentPage === 'profile' && profileView === 'inventory' && (
          <div className="animate-in fade-in duration-300">
             <div className="bg-gradient-to-b from-[#1b3d3d] to-[#000000] px-4 pt-10 pb-4">
                <div className="flex items-center justify-between gap-2">
                   <div className="flex items-center gap-3 overflow-hidden min-w-0">
                      <button 
                        onClick={() => setProfileView('main')}
                        className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
                      >
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <h1 className="text-2xl font-extrabold tracking-tight truncate">Инвентарь</h1>
                   </div>
                   <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 flex-shrink-0">
                      <img src={TON_ICON} alt="TON" className="w-4 h-4" />
                      <span className="text-sm font-bold">{user.balance.toFixed(2)}</span>
                   </div>
                </div>
             </div>

             <div className="flex px-4 gap-8 mb-4 border-b border-white/5 bg-black sticky top-0 z-30">
                {[
                  { id: 'all', label: 'Все' },
                  { id: 'gifts', label: 'Гифты' },
                  { id: 'packs', label: 'Лутпаки' }
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-white' : 'text-gray-500'}`}
                  >
                    {tab.label}
                    {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-t-full" />}
                  </button>
                ))}
             </div>

             {user.inventory.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-24 px-10 text-center">
                  <div className="w-32 h-32 mb-6 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                    <svg className="w-20 h-20 text-white opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                       <path d="M10 14h4m-2-2v4m5-8V5a2 2 0 00-2-2H7a2 2 0 00-2 2v2m16 0h-4M3 7h4m0 0v11a2 2 0 002 2h6a2 2 0 002-2V7M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold mb-10 leading-snug">
                    У тебя пока нет {activeTab === 'all' ? 'айтемов' : activeTab === 'gifts' ? 'гифтов' : 'лутпаков'}.<br/>Время купить!
                  </h3>
                  <button 
                    onClick={() => setCurrentPage('shop')}
                    className="w-full max-w-[280px] bg-[#34d1ed] text-black py-4 rounded-[20px] font-black text-lg shadow-xl shadow-[#34d1ed]/20 active:scale-95 transition-transform"
                  >
                    Открыть магазин
                  </button>
               </div>
             ) : (
               <div className="grid grid-cols-3 gap-3 px-4 pb-10">
                 {user.inventory.map((item, idx) => (
                    <div key={idx} onClick={() => setSelectedItem(item)} className="bg-[#1a1a1a] rounded-2xl p-2.5 flex flex-col items-center active:scale-95 transition-all border border-white/5">
                      <div className="w-full aspect-square bg-white/5 rounded-xl p-2">
                        <TgsPlayer src={item.tgs} loop={false} speed="0.9" style={{ width: '100%', height: '100%' }} />
                      </div>
                      <div className="text-[10px] font-bold mt-2.5 truncate w-full text-center opacity-80">{item.name}</div>
                    </div>
                 ))}
               </div>
             )}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#000000]/90 backdrop-blur-xl border-t border-white/5 flex justify-around py-4 px-4 z-50">
        {[
          { id: 'shop', label: 'Магазин', icon: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M16 10a4 4 0 0 1-8 0' },
          { id: 'pvp', label: 'PvP', icon: 'M12 12m-10 0a10 10 0 1 0 20 0a10 10 0 1 0 -20 0 M12 12m-6 0a6 6 0 1 0 12 0a6 6 0 1 0 -12 0' },
          { id: 'solo', label: 'Solo', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
          { id: 'profile', label: 'Профиль', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8' }
        ].map(nav => (
          <button 
            key={nav.id}
            onClick={() => {
              setCurrentPage(nav.id as any);
              if (nav.id === 'profile') setProfileView('main');
            }}
            className={`flex flex-col items-center gap-1.5 transition-all ${currentPage === nav.id ? 'text-[#34d1ed] scale-110' : 'text-gray-500'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d={nav.icon} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[10px] font-black uppercase tracking-wider">{nav.label}</span>
          </button>
        ))}
      </nav>

      {selectedItem && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-[#1a1a1a] border border-white/10 rounded-[32px] w-full max-w-sm relative overflow-hidden shadow-2xl">
              <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-xl z-10 backdrop-blur-md active:scale-90 transition-transform">✕</button>
              <div className="pt-12 pb-6 flex flex-col items-center">
                 <div className="w-56 h-56 mb-6">
                    <TgsPlayer src={selectedItem.tgs} autoplay loop speed="0.9" style={{ width: '100%', height: '100%' }} />
                 </div>
                 <h2 className="text-3xl font-black mb-2">{selectedItem.name}</h2>
              </div>
              
              <div className="bg-[#111111] p-6 rounded-[24px] m-4 border border-white/5 space-y-3">
                 <div className="flex justify-between text-sm py-1">
                    <span className="text-gray-500 font-bold">Модель</span>
                    <span className="text-white font-black">None</span>
                 </div>
                 <div className="h-px bg-white/5 w-full" />
                 <div className="flex justify-between text-sm py-1">
                    <span className="text-gray-500 font-bold">Фон</span>
                    <span className="text-white font-black">None</span>
                 </div>
                 <div className="h-px bg-white/5 w-full" />
                 <div className="flex justify-between text-sm py-1">
                    <span className="text-gray-500 font-bold">Символ</span>
                    <span className="text-white font-black">None</span>
                 </div>
              </div>

              <div className="p-4">
                 {isItemOwned(selectedItem.id) ? (
                   <button className="w-full h-16 bg-white/5 rounded-[20px] flex items-center justify-center text-gray-500 font-black text-lg cursor-default">УЖЕ В ИНВЕНТАРЕ</button>
                 ) : (
                   <button 
                     onClick={() => setConfirmingPurchase(selectedItem)}
                     className="w-full h-16 bg-[#00b8d4] rounded-[20px] text-lg font-black shadow-2xl shadow-[#00b8d4]/20 active:scale-95 transition-transform text-black"
                   >
                     Купить {selectedItem.price.toFixed(2)} TON
                   </button>
                 )}
              </div>
           </div>
        </div>
      )}

      {confirmingPurchase && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-8 animate-in zoom-in-95 duration-200 backdrop-blur-sm">
           <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 w-full max-w-xs text-center shadow-2xl">
              <h3 className="text-xl font-black mb-4">Подтверждение</h3>
              <p className="text-gray-400 mb-8 font-medium">Купить <span className="text-white font-bold">{confirmingPurchase.name}</span> за <span className="text-[#00b8d4] font-bold">{confirmingPurchase.price.toFixed(2)} TON</span>?</p>
              <div className="flex gap-4">
                 <button onClick={() => handleBuy(confirmingPurchase)} className="flex-1 bg-white text-black py-4 rounded-2xl font-black active:scale-95 transition-transform">ДА</button>
                 <button onClick={() => setConfirmingPurchase(null)} className="flex-1 bg-white/10 py-4 rounded-2xl font-black active:scale-95 transition-transform">НЕТ</button>
              </div>
           </div>
        </div>
      )}

      {showPromo && (
        <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-8 backdrop-blur-md">
           <div className="bg-[#1a1a1a] border border-[#00b8d4]/30 rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
              <h3 className="text-xl font-black mb-6">Ввести промокод</h3>
              <input 
                autoFocus
                type="text" 
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="PROMO..."
                className="w-full bg-black border-2 border-[#00b8d4]/20 rounded-2xl px-4 py-4 text-center text-lg font-black outline-none mb-6 focus:border-[#00b8d4]/60 transition-colors uppercase"
              />
              <div className="flex gap-4">
                 <button onClick={applyPromo} className="flex-1 bg-[#00b8d4] text-white py-4 rounded-2xl font-black active:scale-95 transition-transform shadow-lg shadow-[#00b8d4]/20">АКТИВИРОВАТЬ</button>
                 <button onClick={() => { setShowPromo(false); setPromoCode(''); }} className="flex-1 bg-white/10 py-4 rounded-2xl font-black active:scale-95 transition-transform">ОТМЕНА</button>
              </div>
           </div>
        </div>
      )}

      {toast && (
        <div className={`fixed top-12 left-6 right-6 py-4 px-6 rounded-2xl z-[500] flex items-center gap-4 font-black shadow-2xl animate-in slide-in-from-top-10 duration-500 border border-white/10 backdrop-blur-xl ${toast.type === 'success' ? 'bg-green-500/90' : 'bg-red-500/90'}`}>
           <span className="text-2xl">{toast.type === 'success' ? '✅' : '❌'}</span>
           <span className="text-sm leading-tight">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default App;
