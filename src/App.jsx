import React, { useState, useRef, useEffect, useContext, createContext } from "react";
import emailjs from "@emailjs/browser";
import { HashRouter as Router, Routes, Route, Link, useParams, useNavigate } from "react-router-dom";

// ───────────── Simple localStorage auth (demo) ─────────────
const ADMIN_ACCOUNT = {
  email: "website@a2vission.com",
  password: "AA324/7bobita",
  role: "admin",
};
function loadUsers() {
  const stored = JSON.parse(localStorage.getItem("users") || "[]");
  if (!stored.find((u) => u.email === ADMIN_ACCOUNT.email)) {
    stored.push(ADMIN_ACCOUNT);
    localStorage.setItem("users", JSON.stringify(stored));
  }
  return stored;
}
function saveUsers(list) {
  localStorage.setItem("users", JSON.stringify(list));
}


// ⚠️ Ejecuta:  npm install @emailjs/browser

/*──────────────────────────
  EmailJS constants (global)
──────────────────────────*/
const EMAIL_SERVICE_ID  = "service_fx1243i";
const EMAIL_PUBLIC_KEY  = "ErTYhXQrHedtLERfM";
const TEMPLATE_REPLY    = "template_t8w8wdj";   // auto‑reply al cliente
const TEMPLATE_ADMIN    = "template_t5c91au";   // aviso interno

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
function loadRequests() {
  return JSON.parse(localStorage.getItem("requests") || "[]");
}
function saveRequests(list) {
  localStorage.setItem("requests", JSON.stringify(list));
}

const RECOMMENDED = [APP_PLANS[0], WEB_PLANS[0]];

/*──────────────────────────
  Root
──────────────────────────*/
function LegalTerms() {
  return (
    <section className="container mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold mb-4">Términos y condiciones</h2>
      <p>A² Vission ofrece:</p>
      <ul>
        <li><strong>Plan App:</strong> 50€/mes (6 meses de permanencia). Incluye desarrollo, diseño y soporte.</li>
        <li><strong>Plan Web:</strong> 40€/mes (6 meses de permanencia). Incluye desarrollo web, diseño y mantenimiento.</li>
        <li><strong>Plan Único App:</strong> 350€ pago único. Incluye desarrollo y diseño, válido 1 mes.</li>
        <li><strong>Plan Único Web:</strong> 280€ pago único. Incluye desarrollo y diseño, válido 1 mes.</li>
        <li><strong>Plan Business App:</strong> 30€/mes (+650€ de alta, 1 año de mantenimiento gratis).</li>
        <li><strong>Plan Business Web:</strong> 550€/año. Incluye desarrollo, diseño y 1 año de mantenimiento.</li>
        <li><strong>Marketing:</strong> 80€/mes. Válido hasta cancelar.</li>
        <li><strong>Mantenimiento:</strong> 65€/mes. Edición y solución de problemas, válido hasta cancelar.</li>
      </ul>
      <p>Todos los precios incluyen impuestos. Los planes con permanencia mínima requieren el pago de la totalidad del periodo acordado. Cancelaciones anticipadas pueden incurrir en penalizaciones. Consulta condiciones detalladas y derechos de usuario en este documento.</p>
      <p>Detalles legales completos... [Aquí puedes añadir el resto de tus cláusulas y condiciones legales.]</p>
    </section>
  );
}

function PrivacyPolicy() {
  return (
    <section className="container mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold mb-4">Política de privacidad</h2>
      <p>Aquí van las cláusulas, condiciones de privacidad y uso de datos... Tus datos serán tratados conforme a la normativa vigente y sólo para la gestión de los servicios contratados. Consulta el texto legal completo para más información.</p>
    </section>
  );
}

export default function App() {
  // crea admin en el primer render
  useRef(loadUsers()).current;
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
              {/* Legal routes */}
              <Route path="/terms" element={<LegalTerms />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
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
                  <Link to="/mis-solicitudes" className="block px-4 py-2 text-sm hover:bg-slate-50">Solicitudes</Link>
                  <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-50">Cerrar sesión</button>
                </div>
              )}
            </div>
          )}
          {user && user.role === "admin" && (
            <button onClick={logout} className="text-slate-700 hover:text-sky-600">
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
          {user && user.role === "admin" && (
            <MobileLink to="/admin" onClick={() => setOpen(false)}>Panel admin</MobileLink>
          )}
          {!user && (
            <MobileLink to="/login" onClick={() => setOpen(false)}>Inicio de sesión</MobileLink>
          )}
          {user && (
            <button
              onClick={() => {logout(); setOpen(false);}}
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
      <Link
        to={`/solicitar/${plan.slug}`}
        className="mt-2 py-2 bg-sky-600 text-white rounded-md text-center hover:bg-sky-700"
      >
        Solicitar aquí
      </Link>
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
  const { slug } = useParams();
  const [formData, setFormData] = useState({
    email: user?.email || "",
    phone: user?.phone || "",
    name: user?.name || "",
    lastname: user?.lastname || "",
    message: "",
  });
  const [sent, setSent] = useState(false);
  const formRef = useRef(null);
  const plan = ALL_PLANS.find(p => p.slug === slug);

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

  function handleSubmit(e) {
    e.preventDefault();

    // Generar número de ticket de 6 dígitos
    const ticket = Date.now().toString().slice(-6);

    // 1) Auto‑reply al cliente  (formRef contiene todos los campos)
    emailjs
      .sendForm(SERVICE_ID, TEMPLATE_ID, formRef.current, PUBLIC_KEY)
      .then(() => {
        // 2) Notificación interna con un segundo template
        const adminParams = {
          ticket,
          plan: plan.name,
          email: formData.email,
          phone: formData.phone,
          name: formData.name,
          lastname: formData.lastname,
          message: formData.message,
        };
        return emailjs.send(SERVICE_ID, TEMPLATE_ADMIN, adminParams, PUBLIC_KEY);
      })
      .then(() => {
        // guardar en localStorage para que el admin la vea
        const requests = loadRequests();
        requests.push({
          id: Date.now().toString(),
          ticket,                // número visible
          plan: plan.slug,
          userEmail: formData.email,
          phone: formData.phone,
          name: formData.name,
          lastname: formData.lastname,
          message: formData.message,
          step: 0,
          details: {},           // initialize details map for per-step storage
        });
        saveRequests(requests);
        setSent(true);
      })
      .catch((err) => {
        console.error(err);
        alert("Error exacto: " + (err?.text || err));
      });
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
              <a
                href="/terms"
                className="text-sky-600 hover:underline"
              >
                condiciones
              </a>
              &nbsp;y la&nbsp;
              <a
                href="/privacy"
                className="text-sky-600 hover:underline"
              >
                política de privacidad
              </a>
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
            className="w-full py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700"
          >
            Enviar solicitud
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
    email: "", password: "",
    phone: "", name: "", lastname: "", address: ""
  });
  const nav = useNavigate();

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = e => {
    e.preventDefault();
    // Password validation
    const pwd = form.password;
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(pwd)) {
      return alert("La contraseña debe tener mínimo 8 caracteres, incluir mayúsculas, minúsculas y números.");
    }
    // Sanitize fields
    form.email = form.email.trim();
    form.name = form.name.trim();
    form.lastname = form.lastname.trim();
    form.address = form.address.trim();
    const users = loadUsers();
    if (users.find(u => u.email === form.email)) return alert("Ese correo ya existe.");
    users.push({ ...form, role: "user" });
    saveUsers(users);
    alert("Cuenta creada, inicia sesión.");
    nav("/login");
  };

  return (
    <section className="container mx-auto px-4 py-16 max-w-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Registro</h2>
      <form onSubmit={submit} className="space-y-4">
        <input name="email" type="email" required placeholder="Email" value={form.email} onChange={handle} className="w-full border rounded p-2" />
        <input name="password" type="password" required placeholder="Contraseña" value={form.password} onChange={handle} className="w-full border rounded p-2" />
        <input name="phone" required placeholder="Teléfono" value={form.phone} onChange={handle} className="w-full border rounded p-2" />
        <input name="name" required placeholder="Nombre" value={form.name} onChange={handle} className="w-full border rounded p-2" />
        <input name="lastname" required placeholder="Apellidos" value={form.lastname} onChange={handle} className="w-full border rounded p-2" />
        <input name="address" required placeholder="Dirección" value={form.address} onChange={handle} className="w-full border rounded p-2" />
        <button className="w-full bg-sky-600 text-white rounded py-2">Registrarse</button>
      </form>
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const users = loadUsers();
    const found = users.find(
      (u) => u.email === form.email && u.password === form.password
    );
    if (!found) return alert("Credenciales incorrectas");
    login(found);
    alert(`Bienvenido ${found.role === "admin" ? "administrador" : "usuario"}`);
    navigate("/");
  };

  return (
    <section className="container mx-auto px-4 py-16 flex justify-center">
      <div className="bg-white shadow rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Iniciar sesión</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="Email"
            className="w-full border rounded p-2"
          />
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="Contraseña"
            className="w-full border rounded p-2"
          />
          <button className="w-full bg-sky-600 text-white rounded py-2">
            Entrar
          </button>
        </form>
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
  
    const save = () => {
      const users = loadUsers().map(u => u.email === user.email ? { ...u, ...form } : u);
      saveUsers(users);
      login({ ...user, ...form });   // actualiza contexto
      alert("Perfil actualizado");
    };
  
    const changePw = () => {
      if (!newPass) return;
      const users = loadUsers().map(u => u.email === user.email ? { ...u, password: newPass } : u);
      saveUsers(users);
      alert("Contraseña cambiada");
      setNewPass("");
    };
  
    return (
      <section className="container mx-auto px-4 py-16 max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-center">Mi perfil</h2>
        <div className="space-y-3">
          <input value={form.email} disabled className="w-full border rounded p-2 bg-slate-100" />
          <input name="phone" value={form.phone} onChange={handle} placeholder="Teléfono" className="w-full border rounded p-2" />
          <input name="name" value={form.name} onChange={handle} placeholder="Nombre" className="w-full border rounded p-2" />
          <input name="lastname" value={form.lastname} onChange={handle} placeholder="Apellidos" className="w-full border rounded p-2" />
          <input name="address" value={form.address} onChange={handle} placeholder="Dirección" className="w-full border rounded p-2" />
          <button onClick={save} className="w-full bg-sky-600 text-white rounded py-2">Guardar cambios</button>
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
  const reqs = loadRequests();
  const [showDetailsUser, setShowDetailsUser] = useState({});

  // Toggle logic for step details
  const toggleStepDetails = (id, idx) => {
    setShowDetailsUser(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [idx]: !prev[id]?.[idx],
      }
    }));
  };

  const removeUserRequest = (id) => {
    const list = loadRequests().filter(r => r.id !== id);
    saveRequests(list);
    window.location.reload();
  };

  return (
    <section className="container mx-auto px-4 py-16 space-y-6">
      <h2 className="text-3xl font-bold text-center">Mis solicitudes</h2>

      {reqs.length === 0 && (
        <p className="text-center text-slate-500">No hay solicitudes.</p>
      )}

      {reqs.map((r) => (
        <div key={r.id} className="border rounded p-4">
          <h4 className="font-semibold">
            {ALL_PLANS.find((p) => p.slug === r.plan)?.name}
          </h4>
          {r.step >= 0 ? (
            <>
              <p className="text-xs text-slate-500">{steps[r.step]}</p>
              <ProgressLine
                step={r.step}
                onClickStep={(idx) => toggleStepDetails(r.id, idx)}
              />
              {/* Inline details under each step's bubble */}
              {steps.map((s, idx) =>
                showDetailsUser[r.id]?.[idx] ? (
                  <div key={idx} className="mt-2 p-2 bg-slate-50 rounded">
                    <p className="text-sm font-semibold">Detalles de “{s}”</p>
                    {r.details?.[idx]?.message ? (
                      <p className="text-sm mb-1">
                        <strong>Mensaje admin:</strong> {r.details[idx].message}
                      </p>
                    ) : (
                      <p className="text-sm italic text-slate-500">
                        Sin mensaje para este paso.
                      </p>
                    )}
                    {r.details?.[idx]?.attachment && (
                      <a
                        href={r.details[idx].attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-sky-600 hover:underline"
                      >
                        Ver archivo adjunto
                      </a>
                    )}
                  </div>
                ) : null
              )}
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
    const subs = loadRequests().filter(r => r.step >= 4);
    return (
      <section className="container mx-auto px-4 py-16 space-y-6">
        <h2 className="text-3xl font-bold text-center">Mis suscripciones</h2>
        {subs.length === 0 && <p className="text-center text-slate-500">No tienes suscripciones activas.</p>}
        {subs.map(s => (
          <div key={s.id} className="border rounded p-4">
            <h4 className="font-semibold">{ALL_PLANS.find(p => p.slug === s.plan)?.name}</h4>
            <p className="text-sm text-slate-600">Estado actual: {steps[s.step]}</p>
          </div>
        ))}
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
        </div>

        <LegalLinks />
      </div>
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
  const [reqs, setReqs] = useState(loadRequests());
  const [emailAdmin, setEmailAdmin] = useState("");
  const [msgMap, setMsgMap] = useState({});
  const [fileMap, setFileMap] = useState({});
  const [showDetails, setShowDetails] = useState({});

  // recargar cada vez que vuelvo a la vista
  React.useEffect(() => {
    const int = setInterval(() => setReqs(loadRequests()), 1000);
    return () => clearInterval(int);
  }, []);

  const updateAndSave = (newList) => {
    saveRequests(newList);
    setReqs(newList);
  };

  const setMsg = (id, txt) => setMsgMap({ ...msgMap, [id]: txt });
  const setFile = (id, data) => setFileMap({ ...fileMap, [id]: data });

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
        return {
          ...r,
          step: newStep,
          details,
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
        return { ...r, step: -1, details };
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
    saveUsers(users);
    alert("Usuario marcado como administrador (localStorage).");
    setEmailAdmin("");
  };

  if (!isAdmin) {
    return (
      <section className="container mx-auto px-4 py-16 text-center">
        <p>No autorizado</p>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-16 space-y-8">
      <h2 className="text-3xl font-bold text-center mb-6">
        Panel de administración
      </h2>

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
        {reqs
          .map((r) => (
          <div key={r.id} className="border rounded p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span>
                {ALL_PLANS.find((p) => p.slug === r.plan)?.name} —{" "}
                {r.step >= 0
                  ? `paso ${r.step + 1}/${steps.length}`
                  : "Rechazado"}
              </span>
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
            <button
              onClick={() => setShowDetails({ ...showDetails, [r.id]: !showDetails[r.id] })}
              className="text-sm underline"
            >
              {showDetails[r.id] ? 'Ocultar detalles' : 'Ver detalles'}
            </button>
            <div className={showDetails[r.id] ? '' : 'hidden'}>
              {r.step >= 0 && (
                <>
                  <textarea
                    value={msgMap[r.id] || ""}
                    onChange={(e) => setMsg(r.id, e.target.value)}
                    placeholder="Mensaje opcional al usuario"
                    className="w-full border rounded p-2 text-sm"
                  />
                  <button
                    onClick={() => {
                      // update current message in r.details without advancing step
                      const updated = reqs.map(rr => {
                        if (rr.id === r.id) {
                          const details = { ...(rr.details || {}) };
                          details[rr.step] = {
                            ...details[rr.step],
                            message: msgMap[r.id] || ""
                          };
                          return { ...rr, details };
                        }
                        return rr;
                      });
                      updateAndSave(updated);
                      setMsg(r.id, "");
                      alert("Mensaje guardado");
                    }}
                    className="mt-2 text-sm bg-blue-600 text-white px-2 py-1 rounded"
                  >
                    Guardar mensaje
                  </button>
                </>
              )}
              {r.step === 1 && (
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setFile(r.id, ev.target.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="text-sm"
                />
              )}
              {r.step === 5 && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setFile(r.id, ev.target.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="text-sm"
                />
              )}
            </div>
          </div>
        ))}
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

  const saveConditions = () => {
    localStorage.setItem(storageKey, conditions);
    alert('Condiciones guardadas');
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
        <button
          onClick={saveConditions}
          className="mt-2 bg-green-600 text-white px-4 py-2 rounded"
        >
          Guardar condiciones
        </button>
      )}
      <Link
        to={`/solicitar/${slug}`}
        className="block mt-4 py-2 bg-sky-600 text-white text-center rounded hover:bg-sky-700"
      >
        Solicitar este plan
      </Link>
    </section>
  );
}
