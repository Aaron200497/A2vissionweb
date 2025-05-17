import React, { useState, useRef, useEffect, useContext, createContext } from "react";
import {
  auth,
  db,
  collection,
  doc,
  query,
  where,
  orderBy,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification
} from "./firebase";

function ChatPopup({ reqId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  // Avatares para chat
  const currentAvatar = auth.currentUser.photoURL || null;
  const meInitials = auth.currentUser.email.charAt(0).toUpperCase();
  const otherAvatar = '/img/admin-avatar.png';
  // Animation on mount
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef(null);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const msgsQuery = query(
      collection(db, "requests", reqId, "messages"),
      orderBy("timestamp")
    );
    const unsub = onSnapshot(msgsQuery, snap => {
      setMessages(snap.docs.map(d => d.data()));
    }, err => console.error("Chat onSnapshot:", err));
    return () => unsub();
  }, [reqId]);

  // Auto-scroll on new message
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!text && !file) return;
    try {
      await addDoc(
        collection(db, "requests", reqId, "messages"),
        {
          sender: auth.currentUser.uid,
          text,
          attachment: file,
          timestamp: Date.now(),
        }
      );
    } catch (err) {
      console.error("Error sending chat message:", err);
      alert("Error enviando mensaje: " + err.message);
      return;
    }
    setText("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div
      className={`fixed bottom-4 right-4 w-96 h-96 bg-white shadow-lg rounded-lg flex flex-col
        transform transition-transform duration-300 ease-out
        ${mounted ? 'translate-y-0' : 'translate-y-full'}`}
    >
      <div className="flex justify-between items-center p-2 bg-sky-600 text-white rounded-t-lg">
        <span>Chat solicitud {reqId}</span>
        <button onClick={onClose} className="text-xl leading-none">&times;</button>
      </div>
      <div ref={containerRef} className="flex-1 p-2 overflow-y-auto space-y-2">
        {messages.map((m, i) => {
          const isMe = m.sender === auth.currentUser.uid;
          return (
            <div
              key={i}
              className={`flex items-start mb-2 ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              { !isMe && (
                <img src={otherAvatar} alt="Avatar" className="w-6 h-6 rounded-full mr-2" />
              ) }
              <div
                className={`inline-block p-2 rounded text-sm max-w-[75%] ${
                  isMe ? 'bg-sky-600 text-white' : 'bg-gray-200 text-black'
                }`}
              >
                <div className={`text-xs font-semibold mb-1 ${isMe ? 'text-white' : 'text-gray-700'}`}>
                  {isMe
                    ? 'Tú'
                    : 'Interlocutor'}
                </div>
                {m.text}
              </div>
              { isMe && (
                currentAvatar ? (
                  <img src={currentAvatar} alt="Mi avatar" className="w-6 h-6 rounded-full ml-2" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-bold ml-2">
                    {meInitials}
                  </div>
                )
              ) }
            </div>
          );
        })}
      </div>
      <div className="p-2 border-t flex space-x-1">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Escribe un mensaje"
          className="flex-1 border rounded p-1 text-sm"
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={e => {
            const f = e.target.files[0];
            if (f) {
              const reader = new FileReader();
              reader.onload = ev => setFile(ev.target.result);
              reader.readAsDataURL(f);
            }
          }}
          className="hidden"
        />
        <button onClick={() => fileInputRef.current.click()} className="text-sm px-2">
          📎
        </button>
        <button
          onClick={handleSend}
          title="Enviar mensaje"
          className="text-sm bg-sky-600 text-white px-2 py-1 rounded"
        >
          ✈️
        </button>
      </div>
    </div>
  );
}
import emailjs from "@emailjs/browser";
import { HashRouter as Router, Routes, Route, Link, useParams, useNavigate } from "react-router-dom";

// Stub for the AI sandbox route
function AiTest() {
  return (
    <section className="container mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-center">IA (beta)</h2>
      <p className="text-center text-slate-500">Próximamente en desarrollo.</p>
    </section>
  );
}

/*──────────────────────────
  Firebase
──────────────────────────*/
// Firebase helpers + db instance



// ───────────── Simple localStorage auth (demo) ─────────────
const ADMIN_ACCOUNT = {
  email: "website@a2vission.com",
  password: "AA324/7bobita",
  role: "admin",
};
// Descarga todos los usuarios de Firestore y los deja cacheados en localStorage
async function loadUsers() {
  // 0‑ Si aún no hay ningún usuario autenticado devolvemos la copia en
  //    localStorage para evitar “permission‑denied” y parpadeos.
  if (!auth.currentUser) {
    return JSON.parse(localStorage.getItem("users") || "[]");
  }

  try {
    const snap = await getDocs(collection(db, "users"));
    const list = snap.docs.map(d => d.data());

    // Aseguramos que exista la cuenta admin local
    if (!list.find(u => u.email === ADMIN_ACCOUNT.email)) {
      list.push(ADMIN_ACCOUNT);
    }

    localStorage.setItem("users", JSON.stringify(list));
    return list;
  } catch (err) {
    console.error("🔥 loadUsers()", err.code || err);
    // Modo offline o sin permisos
    return JSON.parse(localStorage.getItem("users") || "[]");
  }
}
async function saveUsers(list, isAdmin = false) {
  // 1‑ Siempre sincronizamos la copia local para que la UI funcione offline
  localStorage.setItem("users", JSON.stringify(list));

  /* 2‑ Reglas de seguridad (Firestore):
        - Los usuarios normales solo pueden escribir en su propio documento
        - Un administrador (claim custom admin == true) puede escribir cualquiera
     Para evitar el error “Missing or insufficient permissions” durante el
     registro de un usuario normal, enviamos a Firestore únicamente los
     documentos permitidos.
  */
  if (isAdmin) {
    // El panel admin puede modificar cualquier usuario
    for (const u of list) {
      await setDoc(doc(db, "users", u.email), u, { merge: true });
    }
  } else if (auth.currentUser) {
    // Usuario corriente → solo puede grabar su propia ficha
    const me = list.find(u => u.email === auth.currentUser.email);
    if (me) {
      await setDoc(doc(db, "users", me.email), me, { merge: true });
    }
  }
}


// ⚠️ Ejecuta:  npm install @emailjs/browser

/*──────────────────────────
  EmailJS constants (global)
──────────────────────────*/
const EMAIL_SERVICE_ID  = "service_fx1243i";
const EMAIL_PUBLIC_KEY  = "ErTYhXQrHedtLERfM";
const TEMPLATE_REPLY    = "template_t8w8wdj";   // auto‑reply al cliente
const TEMPLATE_ADMIN    = "template_t5c91au";   // aviso interno
const TEMPLATE_PASSWORD = "template_pwchange";  // aviso cambio de contraseña

/*──────────────────────────
  Auth context (localStorage)
──────────────────────────*/
const AuthCtx = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("currentUser") || "null")
  );

  const login = (u) => {
    localStorage.setItem("currentUser", JSON.stringify(u));
    setUser(u);
  };
  const logout = () => {
    localStorage.removeItem("currentUser");
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

const useAuth = () => useContext(AuthCtx);

/*──────────────────────────
  Datos de planes
──────────────────────────*/
const APP_PLANS = [
  {
    slug: "a2-vission-app",
    name: "A² Vission App",
    price: "50€ / mes",
    details: "+59,99€ Desarrollo y Diseño · 6 meses de permanencia",
  },
  {
    slug: "a2-unico-app",
    name: "A² Unico App",
    price: "350€ pago único",
    details: "Incluye Desarrollo + Diseño · válido 1 mes",
  },
  {
    slug: "a2-business-app",
    name: "A² Business App",
    price: "30€ / mes",
    details: "+650€ de alta · 1 año de mantenimiento gratis",
  },
];

const EXTRA_PLANS = [
  {
    slug: "marketing",
    name: "Marketing",
    price: "80€ / mes",
    details: "Plan válido hasta cancelar",
  },
  {
    slug: "mantenimiento",
    name: "Mantenimiento",
    price: "65€ / mes",
    details: "Editar + solucionar problemas · válido hasta cancelar",
  },
];

const WEB_PLANS = [
  {
    slug: "a2-vission-web",
    name: "A² Vission Web",
    price: "40€ / mes",
    details:
      "Desarrollo web + Diseño + Mantenimiento · 6 meses permanencia",
  },
  {
    slug: "a2-unico-web",
    name: "A² Unico Web",
    price: "280€ pago único",
    details: "Desarrollo + Diseño · válido 1 mes",
  },
  {
    slug: "a2-business-web",
    name: "A² Business Web",
    price: "550€ / año",
    details: "Desarrollo + Diseño · 1 año de mantenimiento incluido",
  },
];

const ALL_PLANS = [...APP_PLANS, ...EXTRA_PLANS, ...WEB_PLANS];

/* Estados posibles de una solicitud */
const steps = [
    "Recibido",
    "Presupuesto",
    "Método de pago",
    "Preview",
    "Trabajo aceptado",
    "Estamos trabajando en ello",
    "Finalización",
  ];
/* Almacenamos solicitudes en localStorage para la demo */
async function loadRequests() {
  try {
    const snap = await getDocs(collection(db, "requests"));
    const list = snap.docs.map(d => d.data());
    localStorage.setItem("requests", JSON.stringify(list));
    return list;
  } catch (err) {
    console.error("🔥 loadRequests()", err.code || err);
    // Modo offline o sin permisos
    return JSON.parse(localStorage.getItem("requests") || "[]");
  }
}
async function saveRequests(list) {
  localStorage.setItem("requests", JSON.stringify(list));
  for (const r of list) {
    await setDoc(doc(db, "requests", r.id), r);
  }
}
async function loadSubscriptions() {
  try {
    const snap = await getDocs(collection(db, "subscriptions"));
    const list = snap.docs.map(d => d.data());
    localStorage.setItem("subscriptions", JSON.stringify(list));
    return list;
  } catch (err) {
    console.error("🔥 loadSubscriptions()", err.code || err);
    return JSON.parse(localStorage.getItem("subscriptions") || "[]");
  }
}
async function saveSubscriptions(list) {
  localStorage.setItem("subscriptions", JSON.stringify(list));
  for (const s of list) {
    await setDoc(doc(db, "subscriptions", s.id), s);
  }
}

/* ─ Persistencia de metadatos de planes ─ */
async function loadPlanMeta(slug) {
  try {
    const snap = await getDoc(doc(db, "plans", slug));
    return snap.exists() ? snap.data() : {};
  } catch (e) {
    console.error("loadPlanMeta", e);
    return {};
  }
}
async function savePlanMeta(slug, data) {
  try {
    await setDoc(doc(db, "plans", slug), data, { merge: true });
  } catch (e) {
    console.error("savePlanMeta", e);
  }
}

const RECOMMENDED = [APP_PLANS[0], WEB_PLANS[0]];

// Carga inicial: sincroniza Firestore -> localStorage (solo una vez al abrir)
Promise.all([
  loadUsers(),
  loadRequests(),
  loadSubscriptions()
]).catch(err => console.error("🔥 Firebase sync", err));

/*──────────────────────────
  Root
──────────────────────────*/
function PrivacyPolicy() {
  return (
    <section className="container mx-auto px-4 py-16 space-y-4">
      <h2 className="text-3xl font-bold">Política de privacidad</h2>
      <p>
        A² Vission cumple el Reglamento (UE) 2016/679 (RGPD) y la
        LOPDGDD 3/2018. Los datos que nos facilites —nombre, e‑mail,
        teléfono y detalles del proyecto— se usarán únicamente para
        gestionar los servicios contratados, facturación y soporte.
      </p>
      <p>
        Puedes ejercer tus derechos de acceso, rectificación,
        supresión, portabilidad y oposición enviando un correo a&nbsp;
        <a href="mailto:website@a2vission.com"
           className="text-sky-600 underline">website@a2vission.com</a>.
      </p>
      <p>
        No cedemos datos a terceros salvo obligación legal o
        proveedores imprescindibles (plataformas de pago,
        alojamiento, e‑mail). Conservaremos tu información mientras
        exista relación contractual y los plazos legales de
        prescripción fiscal.
      </p>
    </section>
  );
}

function LegalTerms() {
  return (
    <section className="container mx-auto px-4 py-16 space-y-4">
      <h2 className="text-3xl font-bold">Términos y condiciones</h2>
      <p>
        A² Vission (en adelante “el Prestador”) ofrece planes de
        desarrollo web y app cuyo detalle y precio se muestra en esta
        página. El Cliente declara ser mayor de edad y tener
        capacidad para contratar.
      </p>
      <ul className="list-disc list-inside space-y-1">
        <li>
          Los planes <strong>App</strong> y <strong>Web</strong> llevan una
          permanencia mínima de 6&nbsp;meses. El Cliente se compromete al
          pago íntegro de dicho periodo.
        </li>
        <li>
          Finalizada la permanencia, la suscripción se renueva
          automáticamente mes a mes hasta cancelación.
        </li>
        <li>
          Las cuotas se abonan por adelantado mediante tarjeta o
          débito SEPA. El impago supondrá la suspensión del servicio
          tras 15&nbsp;días.
        </li>
        <li>
          El Prestador entregará las primeras versiones (“preview”) en
          los plazos acordados y realizará hasta dos rondas de
          ajustes sin coste extra.
        </li>
        <li>
          Cualquier funcionalidad no contemplada originalmente se
          presupuestará aparte.
        </li>
      </ul>
      <p>
        Para más información escribe a&nbsp;
        <a href="mailto:website@a2vission.com"
           className="text-sky-600 underline">website@a2vission.com</a>.
      </p>
    </section>
  );
}

function RefundPolicy() {
  return (
    <section className="container mx-auto px-4 py-16 space-y-4">
      <h2 className="text-3xl font-bold">Política de devolución y reembolso</h2>
      <p>
        Si el trabajo entregado no cumple las especificaciones, el
        Cliente dispone de <strong>15&nbsp;días</strong> desde la
        contratación para solicitar reembolso enviando un correo a&nbsp;
        <a href="mailto:website@a2vission.com"
           className="text-sky-600 underline">website@a2vission.com</a>{' '}
        detallando el motivo. No se admitirán devoluciones por cambios
        de opinión o peticiones fuera del alcance acordado.
      </p>
      <p>
        Tras la validación, el importe se devolverá mediante el mismo
        método de pago en un plazo máximo de 7&nbsp;días laborables.
      </p>
    </section>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col font-sans">
          <NavBar />
          <main className="flex-1">
            <Routes>
              <Route path="/profile" element={<Profile />} />
              <Route path="/mis-solicitudes" element={<UserRequests />} />
              <Route path="/suscripciones" element={<UserSubscriptions />} />
              <Route path="/" element={<Home />} />
              <Route path="/planes" element={<Plans />} />
              <Route path="/contacto" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/planes/:slug" element={<PlanDetail />} />
              <Route path="/solicitar/:slug" element={<RequestForm />} />
              <Route path="/admin" element={<AdminPanel />} />
              {/* AI sandbox route */}
              <Route path="/ai-test" element={<AiTest />} />
              {/* Legal routes */}
              <Route path="/terms"   element={<LegalTerms />}   />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/refund"  element={<RefundPolicy />}  />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

/*──────────────────────────
  Navegación
──────────────────────────*/
function NavBar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const [userOpen, setUserOpen] = useState(false);
  // Red dot for unread user requests (only for normal user)
  const [hasUnread, setHasUnread] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (user && user.role !== "admin") {
      loadRequests().then(rs => setHasUnread(rs.some(r => r.unread)));
    }
  }, [user]);

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img src="/img/logo.png" alt="A² Vission" className="h-10 w-10" />
          <span className="font-bold text-xl text-sky-600">A² Vission</span>
        </Link>

        <nav className="hidden md:flex space-x-8 text-sm font-medium">
          <NavLink to="/">Inicio</NavLink>
          <NavLink to="/planes">Planes y precios</NavLink>
          <NavLink to="/contacto">Contacto</NavLink>
          {/* IA link */}
          {user && user.role === "admin"
            ? <NavLink to="/ai-test">IA&nbsp;(beta)</NavLink>
            : <span className="text-slate-400 select-none">IA&nbsp;(próximamente)</span>}
          {user && user.role === "admin" && <NavLink to="/admin">Panel admin</NavLink>}
          {!user && <NavLink to="/login">Inicio de sesión</NavLink>}
          {user && user.role !== "admin" && (
            <div className="relative">
              <button onClick={() => setUserOpen(!userOpen)} className="text-slate-700 hover:text-sky-600">
                Cuenta ▾
              </button>
              {userOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow">
                  <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-slate-50">Mi perfil</Link>
                  <Link to="/suscripciones" className="block px-4 py-2 text-sm hover:bg-slate-50">Suscripciones</Link>
                  <Link to="/mis-solicitudes" className="block px-4 py-2 text-sm hover:bg-slate-50 flex items-center">
                    Solicitudes
                    {hasUnread && (
                      <span className="inline-block w-2 h-2 bg-red-600 rounded-full ml-2" />
                    )}
                  </Link>
                  <button onClick={() => { logout(); navigate("/"); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-50">Cerrar sesión</button>
                </div>
              )}
            </div>
          )}
          {user && user.role === "admin" && (
            <button onClick={() => { logout(); navigate("/"); }} className="text-slate-700 hover:text-sky-600">
              Cerrar sesión
            </button>
          )}
        </nav>

        <button
          className="md:hidden p-2"
          aria-label="Menú"
          onClick={() => setOpen(!open)}
        >
          <span className="block w-6 h-0.5 bg-slate-800 mb-1" />
          <span className="block w-6 h-0.5 bg-slate-800 mb-1" />
          <span className="block w-6 h-0.5 bg-slate-800" />
        </button>
      </div>

      {open && (
        <nav className="md:hidden bg-white border-t border-slate-200">
          <MobileLink to="/" onClick={() => {setOpen(false);}}>Inicio</MobileLink>
          <MobileLink to="/planes" onClick={() => setOpen(false)}>Planes y precios</MobileLink>
          <MobileLink to="/contacto" onClick={() => setOpen(false)}>Contacto</MobileLink>
          {/* IA link mobile */}
          {user && user.role === "admin"
            ? <MobileLink to="/ai-test" onClick={() => setOpen(false)}>IA&nbsp;(beta)</MobileLink>
            : <span className="block px-4 py-3 text-sm text-slate-400">IA&nbsp;(próximamente)</span>}
          {user && user.role === "admin" && (
            <MobileLink to="/admin" onClick={() => setOpen(false)}>Panel admin</MobileLink>
          )}
          {!user && (
            <MobileLink to="/login" onClick={() => setOpen(false)}>Inicio de sesión</MobileLink>
          )}
          {user && (
            <MobileLink to="/mis-solicitudes" onClick={() => setOpen(false)}>
              Solicitudes
              {user.role !== "admin" && hasUnread && (
                <span className="inline-block w-2 h-2 bg-red-600 rounded-full ml-2" />
              )}
            </MobileLink>
          )}
          {user && (
            <button
              onClick={() => { logout(); navigate("/"); setOpen(false); }}
              className="block w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cerrar sesión
            </button>
          )}
        </nav>
      )}
    </header>
  );
}

const NavLink = ({ to, children }) => (
  <Link to={to} className="text-slate-700 hover:text-sky-600">
    {children}
  </Link>
);

const MobileLink = ({ to, onClick, children }) => (
  <Link
    to={to}
    onClick={onClick}
    className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
  >
    {children}
  </Link>
);

/*──────────────────────────
  Utilidades
──────────────────────────*/
function PaymentCard({ plan }) {
  const { user } = useAuth();
  return (
    <div className="border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
      <h4 className="text-lg font-semibold mb-2">{plan.name}</h4>
      <p className="text-2xl font-bold text-sky-600 mb-2">{plan.price}</p>
      <p className="text-sm text-slate-600 flex-1">{plan.details}</p>
      {/* New details link */}
      <Link
        to={`/planes/${plan.slug}`}
        className="mt-2 py-2 bg-gray-200 text-slate-700 rounded-md text-center hover:bg-gray-300"
      >
        Ver detalles
      </Link>
      {/* Existing request button */}
      {user ? (
        <Link
          to={`/solicitar/${plan.slug}`}
          className="mt-2 py-2 bg-sky-600 text-white rounded-md text-center hover:bg-sky-700"
        >
          Solicitar aquí
        </Link>
      ) : (
        <Link
          to="/login"
          className="mt-2 py-2 bg-slate-300 text-slate-600 rounded-md text-center hover:bg-slate-400"
        >
          Inicia sesión para solicitar
        </Link>
      )}
    </div>
  );
}

/*──────────────────────────
  Home
──────────────────────────*/
function Home() {
  return (
    <>
      <section className="bg-gradient-to-br from-[#6792d6] via-[#86a7e5] to-[#c0d4ff]">
        <div className="container mx-auto px-4 py-24 grid md:grid-cols-2 gap-8 items-center">
          <div className="text-white max-w-xl space-y-6">
            <h1 className="text-5xl font-extrabold">¡Bienvenidos!</h1>
            <p className="text-lg">
              Expertos en desarrollo de aplicaciones y páginas web.
            </p>
            <p>
              Fundamos <strong>A² Vission</strong> para ofrecer soluciones
              digitales accesibles y personalizadas.
            </p>
          </div>
          <div className="flex justify-center md:justify-end">
            <img
              src="/img/tagline.png"
              alt="tagline"
              className="max-w-sm md:max-w-md"
            />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pt-16 pb-24">
        <h2 className="text-3xl font-bold text-center mb-12">
          Planes recomendados
        </h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {RECOMMENDED.map((p) => (
            <PaymentCard key={p.slug} plan={p} />
          ))}
        </div>
        <p className="text-center text-sm text-slate-600">
          Para solicitar cualquiera de estos planes, complete el formulario y recibirá respuesta en un plazo máximo de <strong>5&nbsp;días laborables</strong>.
        </p>
      </section>

      <section className="container mx-auto px-4 py-16 bg-slate-50">
        <h2 className="text-3xl font-bold text-center mb-12">
          Lo que opinan nuestros clientes
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <blockquote
              key={i}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow relative"
            >
              <p className="text-slate-600 mb-4">“{t.quote}”</p>
              <footer className="text-slate-900 font-semibold">{t.name}</footer>
              <span className="absolute -top-3 left-6 text-5xl text-sky-200 select-none">
                “
              </span>
            </blockquote>
          ))}
        </div>
      </section>
    </>
  );
}

const testimonials = [
  {
    name: 'Juan Pérez – CEO de TiendaSmart',
    quote: 'Gracias a A² Vission nuestra tienda duplicó las ventas.',
  },
  {
    name: 'Lucía Gómez – FitLife App',
    quote: 'Transformaron mi idea en una app increíble.',
  },
  {
    name: 'Carlos Morales – Restaurante El Sabor',
    quote: 'La nueva web nos trajo más clientes.',
  },
];

/*──────────────────────────
  Planes y precios
──────────────────────────*/
function PlanCategory({ title, img, plans }) {
  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-center">{title}</h3>
      <div className="flex justify-center mb-8">
        <img src={img} alt={title} className="max-w-4xl shadow rounded-xl" />
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((p) => (
          <PaymentCard key={p.slug} plan={p} />
        ))}
      </div>
    </div>
  );
}

function Plans() {
  return (
    <section className="container mx-auto px-4 py-16 space-y-24">
      <PlanCategory
        title="Aplicaciones"
        img="/img/app.png"
        plans={APP_PLANS}
      />
      <PlanCategory
        title="Sitios web"
        img="/img/web.png"
        plans={WEB_PLANS}
      />
      <PlanCategory
        title="Extras"
        img="/img/Extras.png"
        plans={EXTRA_PLANS}
      />

      <p className="text-center text-sm text-slate-600 mt-8">
        Envia tu solicitud y te contestaremos en un plazo máximo de <strong>5&nbsp;días laborables</strong>.
      </p>
    </section>
  );
}

function RequestForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams();
  const [formData, setFormData] = useState({
    email: user?.email || "",
    phone: user?.phone || "",
    name: user?.name || "",
    lastname: user?.lastname || "",
    message: "",
  });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);
  const plan = ALL_PLANS.find(p => p.slug === slug);

  // Si el usuario no ha iniciado sesión, redirige a /login
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!plan) {
    return (
      <section className="container mx-auto px-4 py-16 text-center">
        <p className="text-lg">Plan no encontrado.</p>
        <Link to="/planes" className="text-sky-600 hover:underline">Volver a planes</Link>
      </section>
    );
  }

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  // IDs de EmailJS (usa las constantes globales)
  const SERVICE_ID  = EMAIL_SERVICE_ID;
  const TEMPLATE_ID = TEMPLATE_REPLY;
  const PUBLIC_KEY  = EMAIL_PUBLIC_KEY;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    // Generar número de ticket de 6 dígitos
    const ticket = Date.now().toString().slice(-6);

    // añade ticket hidden para EmailJS
    const ticketInput = document.createElement("input");
    ticketInput.type = "hidden";
    ticketInput.name = "ticket";
    ticketInput.value = ticket;
    formRef.current.appendChild(ticketInput);

    try {
      // Auto‑reply al cliente
      await emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, formRef.current, PUBLIC_KEY);
      // Aviso interno
      await emailjs.send(SERVICE_ID, TEMPLATE_ADMIN, {
        ticket,
        plan: plan.name,
        email: formData.email,
        phone: formData.phone,
        name: formData.name,
        lastname: formData.lastname,
        message: formData.message,
      }, PUBLIC_KEY);

      // Prepara y guarda en Firestore
      const newReq = {
        id: Date.now().toString(),
        uid: auth.currentUser.uid,
        ticket,
        plan: plan.slug,
        userEmail: formData.email,
        phone: formData.phone,
        name: formData.name,
        lastname: formData.lastname,
        message: formData.message,
        step: 0,
        details: {},
      };
      // Save request using setDoc
      await setDoc(doc(db, "requests", newReq.id), newReq);

      // Sincroniza localStorage
      await loadRequests();
      setSent(true);
    } catch (err) {
      console.error("Error al guardar solicitud:", err);
      alert("Error guardando la solicitud: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="container mx-auto px-4 py-16 max-w-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Solicitar: {plan.name}</h2>
      {sent ? (
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold">¡Solicitud enviada correctamente!</p>
          <Link to="/" className="text-sky-600 hover:underline">Volver al inicio</Link>
        </div>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Plan seleccionado</label>
            <input
              type="text"
              value={plan.name}
              readOnly
              className="mt-1 w-full rounded-md bg-slate-100 border-slate-300"
            />
            {/* Campos ocultos para EmailJS */}
            <input type="hidden" name="solicitud" value={plan.name} />
            <input
              type="hidden"
              name="to_name"
              value={`${formData.name} ${formData.lastname}`.trim()}
            />
            {/* Email fijo para notificación interna */}
            <input type="hidden" name="to_email" value="website@a2vission.com" />
          </div>

          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-md border-slate-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Teléfono</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-md border-slate-300"
            />
          </div>

          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium">Nombre</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-md border-slate-300"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium">Apellidos</label>
              <input
                type="text"
                name="lastname"
                value={formData.lastname}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-md border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Descripción del proyecto</label>
            <textarea
              name="message"
              rows="4"
              value={formData.message}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border-slate-300"
            ></textarea>
          </div>

          <div className="flex items-start space-x-2">
            <input type="checkbox" required className="mt-1" />
            <span className="text-sm">
              Acepto las&nbsp;
              <Link to="/terms" className="text-sky-600 hover:underline">
                condiciones
              </Link>
              &nbsp;y la&nbsp;
              <Link to="/privacy" className="text-sky-600 hover:underline">
                política de privacidad
              </Link>
              .
            </span>
          </div>
          {plan.details.includes('6 meses') && (
            <div className="flex items-start space-x-2">
              <input type="checkbox" required className="mt-1" id="permanence" />
              <span className="text-sm">
                Acepto una permanencia mínima de 6 meses para este plan.
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Enviar solicitud"}
          </button>
        </form>
      )}
    </section>
  );
}

/*──────────────────────────
  Contacto
──────────────────────────*/
function Contact() {
  return (
    <section className="container mx-auto px-4 py-16 max-w-3xl space-y-8">
      <h2 className="text-3xl font-bold">Contáctanos</h2>
      <p>Escríbenos o llámanos y hablemos de tu proyecto.</p>

      <div className="space-y-2 text-lg">
        <p>
          <strong>Email:</strong>{' '}
          <a
            href="mailto:website@a2vission.com"
            className="text-sky-600 hover:underline"
          >
            website@a2vission.com
          </a>
        </p>
        <p>
          <strong>Teléfono:</strong>{' '}
          <a
            href="tel:+34666876120"
            className="text-sky-600 hover:underline"
          >
            +34 666 876 120
          </a>
        </p>
      </div>

      <hr className="my-8" />

      <LegalLinks />
    </section>
  );
}

/*──────────────────────────
  Registro
──────────────────────────*/
function Register() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    phone: "",
    name: "",
    lastname: "",
    address: ""
  });
  const nav = useNavigate();

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    // validación contraseña
    const pwd = form.password;
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(pwd)) {
      return alert("La contraseña debe tener mínimo 8 caracteres, incluir mayúsculas, minúsculas y números.");
    }
    // sanea campos
    form.email = form.email.trim();
    form.name = form.name.trim();
    form.lastname = form.lastname.trim();
    form.address = form.address.trim();

    try {
      // 1‑ crea el usuario en Firebase Auth
      await createUserWithEmailAndPassword(auth, form.email, form.password);

      // Envía verificación
      await sendEmailVerification(auth.currentUser);
      alert("Te hemos enviado un correo para verificar tu cuenta. Revisa tu bandeja e inicia sesión cuando esté verificado.");

      // 2‑ guarda ficha en Firestore + localStorage
      const users = await loadUsers();
      users.push({ ...form, role: "user" });
      await saveUsers(users);

      nav("/login");
    } catch (err) {
      console.error("register()", err.code || err);
      if (err.code === "auth/email-already-in-use") {
        alert("Ese correo ya está registrado. Pulsa en '¿Olvidaste contraseña?' para restablecerla o inicia sesión.");
      } else {
        alert(err.message || "Error creando la cuenta.");
      }
    }
  };

  return (
    <section className="container mx-auto px-4 py-16 max-w-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Registro</h2>
      <form onSubmit={submit} className="space-y-4">
        <input name="email" type="email" required placeholder="Email" value={form.email} onChange={handle} className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-sky-500 focus:border-sky-500" />
        <input name="password" type="password" required placeholder="Contraseña" value={form.password} onChange={handle} className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-sky-500 focus:border-sky-500" />
        <input name="phone" required placeholder="Teléfono" value={form.phone} onChange={handle} className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-sky-500 focus:border-sky-500" />
        <input name="name" required placeholder="Nombre" value={form.name} onChange={handle} className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-sky-500 focus:border-sky-500" />
        <input name="lastname" required placeholder="Apellidos" value={form.lastname} onChange={handle} className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-sky-500 focus:border-sky-500" />
        <input name="address" required placeholder="Dirección" value={form.address} onChange={handle} className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-sky-500 focus:border-sky-500" />
        <button className="w-full bg-sky-600 text-white rounded py-2">Registrarse</button>
      </form>
      <p className="text-sm text-center mt-2">
        ¿Olvidaste la contraseña?&nbsp;
        <button
          type="button"
          onClick={() => {
            if (!form.email) return alert("Introduce tu email arriba.");
            sendPasswordResetEmail(auth, form.email)
              .then(() => alert("Se ha enviado un correo para restablecer la contraseña."))
              .catch(e => alert(e.message));
          }}
          className="text-sky-600 underline"
        >
          Restablecer
        </button>
      </p>
    </section>
  );
}

/*──────────────────────────
  Login
──────────────────────────*/
function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1‑ login Firebase Auth
      await signInWithEmailAndPassword(auth, form.email, form.password);

      // Verifica email
      if (!auth.currentUser.emailVerified) {
        alert("Debes verificar tu correo antes de iniciar sesión.");
        await auth.signOut();
        return;
      }

      // 2‑ asegura que exista ficha en Firestore / localStorage
      let users = await loadUsers();
      let found  = users.find(u => u.email === form.email);
      if (!found) {
        found = {
          email: form.email,
          role: "user",
          phone: "",
          name: "",
          lastname: "",
          address: ""
        };
        users.push(found);
        await saveUsers(users);
      }
      login(found);
      alert(`Bienvenido ${found.role === "admin" ? "administrador" : "usuario"}`);
      navigate("/");
    } catch (err) {
      console.error("login()", err.code || err);
      alert(err.message || "Credenciales incorrectas");
    }
  };

  return (
    <section className="container mx-auto px-4 py-16 flex justify-center">
      <div className="bg-white shadow-lg rounded-lg p-10 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Iniciar sesión</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="Email"
            className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-sky-500 focus:border-sky-500"
          />
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="Contraseña"
            className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-sky-500 focus:border-sky-500"
          />
          <button className="w-full bg-sky-600 text-white rounded py-2">
            Entrar
          </button>
        </form>
        <p className="text-xs text-center mt-2">
          ¿Olvidaste la contraseña?&nbsp;
          <button
            type="button"
            onClick={() => {
              if (!form.email) return alert("Introduce tu email arriba.");
              sendPasswordResetEmail(auth, form.email)
                .then(() => alert("Se ha enviado un correo de recuperación."))
                .catch(e => alert(e.message));
            }}
            className="text-sky-600 underline"
          >
            Restablecer
          </button>
        </p>
        <p className="text-sm text-center mt-4">
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="text-sky-600 hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </section>
  );
}

/*──────────────────────────
  Footer
──────────────────────────*/
function LegalLinks() {
  return (
    <ul className="space-y-2 list-disc list-inside">
      <li>
        <Link to="/privacy" className="text-sky-600 hover:underline">
          Política de privacidad
        </Link>
      </li>
      <li>
        <Link to="/refund" className="text-sky-600 hover:underline">
          Política de devolución
        </Link>
      </li>
      <li>
        <Link to="/terms" className="text-sky-600 hover:underline">
          Cláusulas y condiciones
        </Link>
      </li>
    </ul>
  );
}
function Profile() {
  const { user, login } = useAuth();
  const [form, setForm] = useState(user);
  const [newPass, setNewPass] = useState("");

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async () => {
    // Save avatar to Firestore directly if present, and sync all other fields as before.
    const allUsers = await loadUsers();
    const updated = allUsers.map(u =>
      u.email === user.email ? { ...u, ...form } : u
    );
    // Sync to localStorage + Firestore
    await saveUsers(updated, /* isAdmin= */ false);
    // Persist avatar field in Firestore document directly
    if (form.avatar) {
      await setDoc(doc(db, "users", user.email), { avatar: form.avatar }, { merge: true });
    }
    // Update context and UI
    login({ ...user, ...form });
    alert("Perfil actualizado");
  };

  const changePw = () => {
    if (!newPass) return;
    const users = loadUsers().map(u =>
      u.email === user.email ? { ...u, password: newPass } : u
    );
    saveUsers(users);
    emailjs.send(
      EMAIL_SERVICE_ID,
      TEMPLATE_PASSWORD,
      { to_email: user.email, new_password: newPass },
      EMAIL_PUBLIC_KEY
    ).catch(err => console.error("Email PW:", err));
    alert("Contraseña cambiada (se ha enviado un e‑mail de aviso).");
    setNewPass("");
  };

  return (
    <section className="container mx-auto px-4 py-16 max-w-md space-y-6">
      <div className="-mt-12 mb-4 text-center">
        {form.avatar
          ? <img src={form.avatar} alt="avatar" className="w-24 h-24 rounded-full border-4 border-white mx-auto" />
          : <div className="w-24 h-24 rounded-full bg-slate-300 mx-auto" />}
      </div>
      <h2 className="text-2xl font-bold text-center">Mi perfil</h2>
      <div className="space-y-3">
        <input value={form.email} disabled className="w-full border rounded p-2 bg-slate-100" />
        <input name="phone" value={form.phone} onChange={handle} placeholder="Teléfono" className="w-full border rounded p-2" />
        <input name="name" value={form.name} onChange={handle} placeholder="Nombre" className="w-full border rounded p-2" />
        <input name="lastname" value={form.lastname} onChange={handle} placeholder="Apellidos" className="w-full border rounded p-2" />
        <input name="address" value={form.address} onChange={handle} placeholder="Dirección" className="w-full border rounded p-2" />
        <button onClick={save} className="w-full bg-sky-600 text-white rounded py-2">Guardar cambios</button>
        {/* selector de foto de perfil */}
        <input
          id="avatarInput"
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={async e => {
            const f = e.target.files[0];
            if (!f) return;
            const r = new FileReader();
            r.onload = async ev => {
              const updated = { ...form, avatar: ev.target.result };
              setForm(updated);

              const users = loadUsers().map(u =>
                u.email === user.email ? { ...u, avatar: ev.target.result } : u
              );
              await saveUsers(users, false);
              await setDoc(doc(db, "users", user.email), { avatar: ev.target.result }, { merge: true });

              login({ ...user, avatar: ev.target.result });
            };
            r.readAsDataURL(f);
          }}
        />
        <button
          type="button"
          onClick={() => document.getElementById('avatarInput').click()}
          className="w-full bg-sky-600 text-white rounded py-2"
        >
          Cambiar foto de perfil
        </button>
      </div>

      <div className="space-y-3">
        <input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Nueva contraseña" className="w-full border rounded p-2" />
        <button onClick={changePw} className="w-full bg-sky-600 text-white rounded py-2">Cambiar contraseña</button>
      </div>
    </section>
  );
}
  
/* Visual timeline de estado */
function ProgressLine({ step, onClickStep }) {
  return (
    <div className="flex items-center space-x-2 mt-2">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center">
          <button
            type="button"
            onClick={() => onClickStep(i)}
            className="focus:outline-none"
          >
            <span
              className={`block w-4 h-4 rounded-full ${
                i < step
                  ? 'bg-sky-600'
                  : i === step
                  ? 'bg-sky-400 animate-pulse'
                  : 'bg-slate-300'
              }`}
            ></span>
          </button>
          {i < steps.length - 1 && (
            <div
              className={`w-8 h-0.5 ${
                i < step ? 'bg-sky-600' : 'bg-slate-300'
              }`}
            ></div>
          )}
        </div>
      ))}
    </div>
  );
}

function UserRequests() {
  const [reqs, setReqs] = useState([]);
  const [userReplyMap, setUserReplyMap] = useState({});
  const [chatOpenUser, setChatOpenUser] = useState({});
  const toggleChatUser = id =>
    setChatOpenUser(prev => ({ ...prev, [id]: !prev[id] }));

  const removeUserRequest = (id) => {
    const list = loadRequests().filter(r => r.id !== id);
    saveRequests(list);
    window.location.reload();
  };

  // Helper to save user reply per step
  const saveUserReply = (id, idx) => {
    const list = loadRequests().map(r => {
      if (r.id === id) {
        const details = { ...(r.details || {}) };
        details[idx] = {
          ...details[idx],
          userReply: userReplyMap[id]?.[idx] || ""
        };
        return { ...r, details };
      }
      return r;
    });
    saveRequests(list);
    alert("Respuesta guardada");
  };

  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    // Carga inicial de solicitudes desde localStorage
    loadRequests().then(list => {
      const filtered = list.filter(r => r.userEmail === user.email);
      setReqs(filtered);
    });

    const q = query(
      collection(db, "requests"),
      where("userEmail", "==", user.email)
    );

    // realtime subscription without flashes
    const unsubscribe = onSnapshot(
      q,
      snap => {
        const list = snap.docs.map(d => d.data());
        localStorage.setItem("requests", JSON.stringify(list));
        setReqs(list);
      },
      err => {
        console.error("onSnapshot requests-user", err);
        // Fallback: carga desde localStorage si falla el realtime
        loadRequests().then(list => {
          const filtered = list.filter(r => r.userEmail === user.email);
          setReqs(filtered);
        });
      }
    );

    return () => unsubscribe();
  }, [user]);

  return (
    <section className="container mx-auto px-4 py-16 space-y-6">
      <h2 className="text-3xl font-bold text-center">Mis solicitudes</h2>

      {reqs.length === 0 && (
        <p className="text-center text-slate-500">No hay solicitudes.</p>
      )}

      {reqs.map((r) => (
        <div key={r.id} className="border rounded p-4">
          {/* Chat popup always accessible from card */}
          {chatOpenUser[r.id] && (
            <ChatPopup reqId={r.id} onClose={() => toggleChatUser(r.id)} />
          )}
          <div className="flex items-center">
            <h4 className="font-semibold">
              {ALL_PLANS.find((p) => p.slug === r.plan)?.name}
            </h4>
            {/* Centered "Abrir chat" button */}
            <button
              onClick={() => toggleChatUser(r.id)}
              className="ml-auto text-sm bg-sky-600 text-white px-2 py-1 rounded"
            >
              Abrir chat
            </button>
            {/* Red dot if unread */}
            {r.unread && (
              <span className="inline-block w-2 h-2 bg-red-600 rounded-full ml-2" />
            )}
          </div>
          {r.step >= 0 ? (
            <>
              <p className="text-xs text-slate-500">{steps[r.step]}</p>
              <ProgressLine step={r.step} />
            </>
          ) : (
            <p className="text-xs text-red-600">Rechazado</p>
          )}

          {r.step < 0 && (
            <button
              onClick={() => removeUserRequest(r.id)}
              className="mt-2 bg-slate-500 text-white text-sm px-3 py-1 rounded"
            >
              Eliminar solicitud
            </button>
          )}
        </div>
      ))}
    </section>
  );
}
  
function UserSubscriptions() {
  const [subs, setSubs] = useState([]);

  useEffect(() => {
    loadSubscriptions().then(setSubs).catch(console.error);
  }, []);

  return (
    <section className="container mx-auto px-4 py-16 space-y-6">
      <h2 className="text-3xl font-bold text-center">Mis suscripciones</h2>
      {subs.length === 0 && (
        <p className="text-center text-slate-500">
          No tienes suscripciones activas.
        </p>
      )}
      {subs.map((s) => {
        const plan = ALL_PLANS.find((p) => p.slug === s.plan);
        const start = new Date(s.start);
        const permEnd = new Date(start);
        permEnd.setMonth(permEnd.getMonth() + 6);
        const today = new Date();
        const canCancel = today > permEnd;
        return (
          <div key={s.id} className="border rounded p-4 space-y-2">
            <h4 className="font-semibold">{plan?.name}</h4>
            <p className="text-sm text-slate-600">Precio: {plan?.price}</p>
            <p className="text-sm text-slate-600">
              Inicio: {start.toLocaleDateString()}
              <br />
              Fin permanencia: {permEnd.toLocaleDateString()}
            </p>
            <button
              disabled={!canCancel}
              className={`px-4 py-1 rounded ${
                canCancel
                  ? "bg-red-600 text-white"
                  : "bg-slate-300 text-slate-500"
              }`}
              onClick={() => {
                if (!canCancel) return;
                alert(
                  "Se procesará la cancelación al final del periodo pagado."
                );
              }}
            >
              Cancelar suscripción
            </button>
          </div>
        );
      })}
    </section>
  );
}
function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 text-sm py-8 mt-16">
      <div className="container mx-auto px-4 flex flex-col md:flex-row md:justify-between space-y-6 md:space-y-0">
        <div className="space-y-1">
          <p>
            Email:{' '}
            <a
              href="mailto:website@a2vission.com"
              className="hover:underline text-white"
            >
              website@a2vission.com
            </a>
          </p>
          <p>
            Teléfono:{' '}
            <a href="tel:+34666876120" className="hover:underline text-white">
              +34 666 876 120
            </a>
          </p>
          <p className="text-slate-300 text-sm">Horario: 09:00 – 18:00</p>
        </div>

        <LegalLinks />
      </div>
      <p className="w-full text-center text-xs text-slate-500 mt-4">
        ©️ 2025 Desarrollado y Diseñado por A² Vission
      </p>
    </footer>
  );
}

/*───────────────────────────────────────────────────────────────*/
// MySubscriptions
function MySubscriptions() {
  const { user } = useAuth();
  const [subs, setSubs] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "subscriptions"), where("uid", "==", user.uid));
    return onSnapshot(q, snap =>
      setSubs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [user]);

  const cancel = async (id, permanentEnd) => {
    if (Date.now() < permanentEnd) {
      return alert("No puedes cancelar hasta fin de permanencia");
    }
    await updateDoc(doc(db, "subscriptions", id), { active: false });
  };

  return (
    <section className="container mx-auto px-4 py-16 space-y-8">
      <h2 className="text-3xl font-bold text-center">Mis suscripciones</h2>

      {subs.length === 0 && (
        <p className="text-center text-slate-500">
          Aún no tienes suscripciones activas.
        </p>
      )}

      {subs.map(s => {
        const plan = PLANS.find(p => p.slug === s.plan);
        const endPerm = s.startAt + plan.permanent * 30 * 24 * 3600 * 1000;
        const canCancel = Date.now() >= endPerm && s.active;

        return (
          <div key={s.id} className="border rounded p-4 space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold">{plan?.name}</h4>
              <span className={s.active ? 'text-green-600' : 'text-slate-500'}>
                {s.active ? 'Activa' : 'Cancelada'}
              </span>
            </div>

            <p className="text-sm text-slate-600">
              Inicio: {new Date(s.startAt).toLocaleDateString()}<br />
              Permanencia: {plan.permanent} meses
            </p>

            <button
              className={`mt-2 py-1 px-4 rounded ${
                canCancel
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
              disabled={!canCancel}
              onClick={() => canCancel && cancel(s.id, endPerm)}
            >
              Cancelar suscripción
            </button>

            {!canCancel && s.active && (
              <p className="text-xs text-slate-500">
                Podrás cancelar a partir del {new Date(endPerm).toLocaleDateString()}.
              </p>
            )}
          </div>
        );
      })}
    </section>
  );
}

/*───────────────────────────────────────────────────────────────*/
// Admin Panel
function AdminPanel() {
  const { user } = useAuth();
  const isAdmin = user && user.role === "admin";
  const [reqs, setReqs] = useState([]);
  const [view, setView] = useState('requests');
  const [emailAdmin, setEmailAdmin] = useState("");
  const [msgMap, setMsgMap] = useState({});
  const [fileMap, setFileMap] = useState({});
  const [showDetails, setShowDetails] = useState({});
  // Subscription assignment state
  const [subEmail, setSubEmail] = useState('');
  const [subPlan, setSubPlan] = useState(APP_PLANS[0].slug);

  // carga inicial asíncrona (replaced with onSnapshot below)
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "requests"),
      snap => {
        const list = snap.docs.map(d => d.data());
        saveRequests(list);
        setReqs(list);
      },
      err => console.error("onSnapshot requests (admin)", err)
    );
    return () => unsub();
  }, []);

  const updateAndSave = (newList) => {
    saveRequests(newList);
    setReqs(newList);
  };

  const setMsg = (id, txt) => setMsgMap({ ...msgMap, [id]: txt });
  const setFile = (id, data) => setFileMap({ ...fileMap, [id]: data });

  // When admin advances step and sends a message, set unread=true on this request
  const advanceStep = (id) => {
    const currentMsg  = msgMap[id] || "";
    const currentFile = fileMap[id] || "";
    const list = reqs.map((r) => {
      if (r.id === id && r.step < steps.length - 1) {
        const newStep = r.step + 1;
        const details = { ...(r.details || {}) };
        details[newStep] = {
          message: currentMsg,
          attachment: currentFile,
        };
        // If admin sends a message, mark as unread for user
        let unreadFlag = r.unread;
        if (currentMsg && currentMsg.trim() !== "") unreadFlag = true;
        return {
          ...r,
          step: newStep,
          details,
          unread: unreadFlag,
        };
      }
      return r;
    });
    updateAndSave(list);
    setMsg(id, "");
    setFile(id, "");
  };

  const removeRequest = (id) => {
    const list = reqs.filter(r => r.id !== id);
    updateAndSave(list);
  };

  const reject = (id) => {
    const list = reqs.map((r) => {
      if (r.id === id) {
        const details = { ...(r.details || {}) };
        details[r.step] = {
          message: msgMap[id] || "",
          attachment: fileMap[id] || null,
        };
        // If admin sends a message, mark as unread for user
        let unreadFlag = r.unread;
        if ((msgMap[id] || "").trim() !== "") unreadFlag = true;
        return { ...r, step: -1, details, unread: unreadFlag };
      }
      return r;
    });
    updateAndSave(list);
    setMsg(id, "");
    setFile(id, "");
  };

  const makeAdmin = () => {
    if (!emailAdmin) return;
    const users = loadUsers().map((u) =>
      u.email === emailAdmin ? { ...u, role: "admin" } : u
    );
    saveUsers(users, true);
    alert("Usuario marcado como administrador (localStorage).");
    setEmailAdmin("");
  };

  // Assign subscription form handler
  const assignSubscription = () => {
    if (!subEmail || !subPlan) {
      alert("Completa todos los campos.");
      return;
    }
    const subs = loadSubscriptions();
    subs.push({
      id: Date.now().toString(),
      email: subEmail,
      plan: subPlan,
      start: new Date().toISOString(),
    });
    saveSubscriptions(subs);
    alert("Suscripción asignada.");
    setSubEmail('');
    setSubPlan(APP_PLANS[0].slug);
  };

  if (!isAdmin) {
    return (
      <section className="container mx-auto px-4 py-16 text-center">
        <p>No autorizado</p>
      </section>
    );
  }

  // Sidebar component
  function Sidebar() {
    return (
      <aside className="w-64 border-r p-4">
        <nav className="space-y-2">
          <button onClick={() => setView('requests')} className="block w-full text-left">Solicitudes</button>
          <button onClick={() => setView('subscriptions')} className="block w-full text-left">Suscripciones</button>
          <button onClick={() => setView('users')} className="block w-full text-left">Usuarios</button>
          <a href="https://dashboard.stripe.com/login" target="_blank" rel="noopener noreferrer" className="block w-full text-left">
            Pagos (Stripe)
          </a>
        </nav>
      </aside>
    );
  }

  // Requests panel
    function RequestsPanel() {
      const [chatOpenAdmin, setChatOpenAdmin] = useState({});
      const toggleChatAdmin = id =>
        setChatOpenAdmin(prev => ({ ...prev, [id]: !prev[id] }));
      return (
        <div className="space-y-8">
          {/* Añadir admin */}
          <div className="border rounded p-4 space-y-2">
            <h3 className="font-semibold">Añadir usuario admin</h3>
            <div className="flex space-x-2">
              <input
                type="email"
                value={emailAdmin}
                onChange={(e) => setEmailAdmin(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="flex-1 border rounded p-2"
              />
              <button
                className="bg-sky-600 text-white px-4 rounded"
                onClick={makeAdmin}
              >
                Añadir
              </button>
            </div>
          </div>

          {/* Solicitudes */}
          <div className="space-y-4">
            <h3 className="font-semibold">Solicitudes</h3>
            {reqs.length === 0 && (
              <p className="text-slate-500 text-sm">No hay solicitudes.</p>
            )}
            {reqs.map((r) => (
              <div key={r.id} className="border rounded p-4 space-y-2">
                {/* Chat popup always accessible from card */}
                {chatOpenAdmin[r.id] && (
                  <ChatPopup reqId={r.id} onClose={() => toggleChatAdmin(r.id)} />
                )}
                <div className="flex justify-between items-center">
                  <span>
                    {ALL_PLANS.find((p) => p.slug === r.plan)?.name} —{" "}
                    {r.step >= 0
                      ? `paso ${r.step + 1}/${steps.length}`
                      : "Rechazado"}
                  </span>
                  {/* Centered "Abrir chat" button */}
                  <button
                    onClick={() => toggleChatAdmin(r.id)}
                    className="text-sm bg-sky-600 text-white px-2 py-1 rounded"
                  >
                    Abrir chat
                  </button>
                  <div className="space-x-2">
                    {r.step >= 0 && r.step < steps.length - 1 && (
                      <button
                        onClick={() => advanceStep(r.id)}
                        className="text-sm bg-sky-600 text-white px-2 py-1 rounded"
                      >
                        Avanzar
                      </button>
                    )}
                    {r.step === steps.length - 1 && (
                      <button
                        onClick={() => removeRequest(r.id)}
                        className="text-sm bg-green-600 text-white px-2 py-1 rounded"
                      >
                        Finalizar
                      </button>
                    )}
                    {r.step >= 0 && (
                      <button
                        onClick={() => reject(r.id)}
                        className="text-sm bg-red-600 text-white px-2 py-1 rounded"
                      >
                        Rechazar
                      </button>
                    )}
                    {r.step === -1 && (
                      <button
                        onClick={() => removeRequest(r.id)}
                        className="text-sm bg-slate-500 text-white px-2 py-1 rounded"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-600">
                  {r.step >= 0 ? steps[r.step] : "Rechazado"}
                </p>
                <p className="text-xs">
                  Nº solicitud: <strong>{r.ticket}</strong><br/>
                  Email: {r.userEmail} — Tel: {r.phone}<br/>
                  {r.name} {r.lastname}<br/>
                  {r.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    }

  // Users panel
    function UsersPanel() {
      const [search, setSearch] = useState("");
      const [list, setList] = useState(() =>
        JSON.parse(localStorage.getItem("users") || "[]")
      );
      const listRef = useRef(list);

      const [open, setOpen] = useState({});
      // Lista filtrada según el texto de búsqueda
      const filtered = list.filter(u =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.name || "").toLowerCase().includes(search.toLowerCase())
      );
      // ─ Modal «añadir suscripción» ─
const [showSubModal, setShowSubModal] = useState(false);
const [subEmail,      setSubEmail]    = useState("");
const [subPlan,       setSubPlan]     = useState(ALL_PLANS[0].slug);

const openSubModal = (email) => {
  setSubEmail(email);
  setSubPlan(ALL_PLANS[0].slug);
  setShowSubModal(true);
};

const saveNewSub = async () => {
  if (!subEmail || !subPlan) {
    alert("Completa todos los campos.");
    return;
  }
  const list = await loadSubscriptions();
  list.push({
    id: Date.now().toString(),
    uid: auth.currentUser.uid,
    email: subEmail.trim(),
    plan: subPlan,
    start: new Date().toISOString(),
  });
  await saveSubscriptions(list);      // Firestore + localStorage
  alert("Suscripción asignada");
  setShowSubModal(false);
};

      useEffect(() => {
        let timer;                       // debounce 200 ms

        return onSnapshot(
          collection(db, "users"),
          snap => {
            const fresh = snap.docs.map(d => d.data());

            if (!fresh.find(u => u.email === ADMIN_ACCOUNT.email)) {
              fresh.push(ADMIN_ACCOUNT);
            }

            clearTimeout(timer);
            timer = setTimeout(() => {
              localStorage.setItem("users", JSON.stringify(fresh));
              listRef.current = fresh;
              setList(fresh);
            }, 200);
          },
          err => console.error("onSnapshot users", err)
        );
      }, []);

      const deleteUser = async (email) => {
        if (!window.confirm("¿Eliminar usuario?")) return;

        let borradoEnFirestore = false;
        try {
          await deleteDoc(doc(db, "users", email));
          borradoEnFirestore = true;
        } catch (e) {
          if (e.code !== "permission-denied") {
            console.error(e);
            alert("No se pudo eliminar");
            return;
          }
          console.warn("permission-denied → borramos solo localStorage");
        }
      
        const nuevaLista = listRef.current.filter(u => u.email !== email);
        localStorage.setItem("users", JSON.stringify(nuevaLista));
        setList(nuevaLista);
      
        if (borradoEnFirestore) alert("Usuario eliminado");
      };
      // For requests and subs info
      const [reqs, setReqs] = useState([]);
      const [subs, setSubs] = useState([]);
      useEffect(() => { loadRequests().then(setReqs); loadSubscriptions().then(setSubs); }, []);

      // Cancelar suscripción admin helper
      const cancelSubAdmin = id => {
        const list = loadSubscriptions().filter(s => s.id !== id);
        saveSubscriptions(list);
        setSubs(list);
        alert("Suscripción cancelada");
      };

      return (
        <div className="space-y-4">
          <h3 className="font-semibold">Usuarios registrados</h3>

          <input
            type="text"
            placeholder="Buscar correo…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border rounded p-2 w-full md:w-80"
          />

          {filtered.length === 0 && (
            <p className="text-sm text-slate-500">Sin resultados.</p>
          )}

          {filtered.map(u => (
            <div
              key={u.email}
              className="flex flex-col md:flex-row md:items-center md:justify-between border rounded p-2 mt-2"
            >
              <span>
                {u.email} ({u.role})
              </span>
              <div className="space-x-2 mt-2 md:mt-0">
  <button
    onClick={() => openSubModal(u.email)}
    className="px-2 py-1 rounded bg-green-600 text-white"
  >
    Añadir&nbsp;sub
  </button>
  <button
    onClick={() => deleteUser(u.email)}
    className="px-2 py-1 rounded bg-red-600 text-white"
  >
    Eliminar
  </button>
  <button
    onClick={() => setOpen({ ...open, [u.email]: !open[u.email] })}
    className="px-2 py-1 rounded bg-blue-600 text-white"
  >
    Detalles
  </button>
</div>
{showSubModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded space-y-3 w-80">
      <h4 className="font-semibold text-lg">Nueva suscripción</h4>

      <input
        type="email"
        value={subEmail}
        onChange={e => setSubEmail(e.target.value)}
        placeholder="Email usuario"
        className="w-full border p-2 rounded"
      />

      <select
        value={subPlan}
        onChange={e => setSubPlan(e.target.value)}
        className="w-full border p-2 rounded"
      >
        {ALL_PLANS.map(p => (
          <option key={p.slug} value={p.slug}>{p.name}</option>
        ))}
      </select>

      <div className="flex justify-end space-x-2">
        <button onClick={() => setShowSubModal(false)} className="px-3 py-1">Cancelar</button>
        <button onClick={saveNewSub} className="bg-sky-600 text-white px-3 py-1 rounded">Guardar</button>
      </div>
    </div>
  </div>
)}
              {open[u.email] && (
                <ul className="text-xs mt-1 pl-4 list-disc w-full md:w-auto">
                  <li>Tel: {u.phone || '-'}</li>
                  <li>Dirección: {u.address || '-'}</li>
                  <li className="mt-1 font-semibold">Solicitudes:</li>
                  {reqs.filter(r=>r.userEmail===u.email).map(r=>(
                    <li key={r.id} className="ml-3 list-disc">{r.ticket} – {steps[r.step] || 'Rech.'}</li>
                  ))}
                  <li className="mt-1 font-semibold">Suscripciones:</li>
                  {subs.filter(s=>s.email===u.email).map(s=>(
                    <li key={s.id} className="ml-3 list-disc flex justify-between items-center">
                      {ALL_PLANS.find(p=>p.slug===s.plan)?.name}
                      <button onClick={()=>cancelSubAdmin(s.id)} className="text-red-500 text-xs ml-2">Cancelar</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      );
    }

  // Subscriptions panel
  function SubscriptionsPanel() {
    const [subs, setSubs] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [email, setEmail] = useState('');
    const [planSel, setPlanSel] = useState(ALL_PLANS[0].slug);
    const openModal = () => setShowModal(true);

    // assignSubscription per instructions
    const assignSubscription = async () => {
      if (!email || !planSel) {
        alert("Completa todos los campos.");
        return;
      }

      const list = await loadSubscriptions();
      list.push({
        id: Date.now().toString(),
        email: email.trim(),
        plan: planSel,
        start: new Date().toISOString(),
      });

      await saveSubscriptions(list);   // wait for Firestore
      setSubs(list);
      alert("Suscripción asignada.");

      // reset form + close modal
      setEmail("");
      setPlanSel(ALL_PLANS[0].slug);
      setShowModal(false);
    };

    useEffect(() => {
      loadSubscriptions().then(setSubs).catch(console.error);
    }, []);

    const removeSub = (id) => {
      const list = subs.filter((s) => s.id !== id);
      saveSubscriptions(list);
      setSubs(list);
    };

    return (
      <div>
        <button onClick={openModal} className="mb-4 bg-sky-600 text-white px-4 py-1 rounded">Nueva suscripción</button>
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded space-y-3 w-80">
              <h4 className="font-semibold text-lg">Asignar suscripción</h4>
              <input type="email" placeholder="Email usuario" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border p-2 rounded"/>
              <select value={planSel} onChange={e=>setPlanSel(e.target.value)} className="w-full border p-2 rounded">
                {ALL_PLANS.map(p=><option key={p.slug} value={p.slug}>{p.name}</option>)}
              </select>
              <div className="flex justify-end space-x-2">
                <button onClick={()=>setShowModal(false)} className="px-3 py-1">Cancelar</button>
                <button onClick={assignSubscription} className="bg-sky-600 text-white px-3 py-1 rounded">Guardar</button>
              </div>
            </div>
          </div>
        )}
        <h3 className="font-semibold">Suscripciones asignadas</h3>
        {subs.length === 0 && (
          <p className="text-sm text-slate-500">No hay suscripciones.</p>
        )}
        {subs.map((s) => (
          <div key={s.id} className="flex justify-between py-1">
            <span>
              {s.email} — {ALL_PLANS.find((p) => p.slug === s.plan)?.name}
            </span>
            <button
              onClick={() => removeSub(s.id)}
              className="text-red-600 text-sm"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="container mx-auto px-4 py-16 space-y-8">
      <h2 className="text-3xl font-bold text-center mb-6">
        Panel de administración
      </h2>
      <div className="flex">
        <Sidebar />
        <div className="flex-1 px-4">
          {view === 'requests' && <RequestsPanel />}
          {view === 'subscriptions' && <SubscriptionsPanel />}
          {view === 'users' && <UsersPanel />}
        </div>
      </div>
    </section>
  );
}
/*──────────────────────────
  Plan Detail
──────────────────────────*/
function PlanDetail() {
  const { user } = useAuth();
  const { slug } = useParams();
  const plan = ALL_PLANS.find(p => p.slug === slug);
  const storageKey = `plan_cond_${slug}`;
  const [conditions, setConditions] = useState(
    localStorage.getItem(storageKey) || (plan && plan.details)
  );
  const isAdmin = user?.role === 'admin';
  // Imagen editable
  const imgKey = `plan_img_${slug}`;
  const visKey = `plan_img_vis_${slug}`;
  const [img,setImg] = useState(localStorage.getItem(imgKey)||'');
  const [visible,setVisible] = useState(localStorage.getItem(visKey)==="1");
  const [meta,setMeta]=useState({});
  useEffect(()=>{
    loadPlanMeta(slug).then(d=>{
      setMeta(d);
      if(d.conditions) setConditions(d.conditions);
      if(d.img) setImg(d.img);
      if(typeof d.visible==="boolean") setVisible(d.visible);
    });
  },[slug]);

  const saveConditions = () => {
    localStorage.setItem(storageKey, conditions);
    alert('Condiciones guardadas');
    savePlanMeta(slug,{conditions});
  };

  if (!plan) {
    return (
      <section className="container mx-auto px-4 py-16 text-center">
        <p className="text-lg">Plan no encontrado.</p>
        <Link to="/planes" className="text-sky-600 hover:underline">Volver a planes</Link>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-16 max-w-xl space-y-6">
      <h2 className="text-2xl font-bold">{plan.name}</h2>
      <p className="text-xl text-sky-600">{plan.price}</p>
      {/* Imagen para usuarios */}
      {visible && (img || meta.img) && (
        <img src={img || meta.img} alt="plan" className="max-h-40 mb-4"/>
      )}
      <label className="block text-sm font-medium">Condiciones:</label>
      {isAdmin ? (
        <textarea
          className="w-full border rounded p-2"
          rows={4}
          value={conditions}
          onChange={e => setConditions(e.target.value)}
        />
      ) : (
        <p className="text-sm text-slate-700 whitespace-pre-line">{conditions}</p>
      )}
      {isAdmin && (
        <>
          <button
            onClick={saveConditions}
            className="mt-2 bg-green-600 text-white px-4 py-2 rounded"
          >
            Guardar condiciones
          </button>
          <div className="space-y-2 mt-4">
            <label className="block text-sm font-medium">Imagen del plan:</label>
            {/* Aquí iría el input de archivo y controles de visibilidad */}
          </div>
        </>
      )}
    </section>
  );
}
