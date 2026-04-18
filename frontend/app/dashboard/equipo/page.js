"use client";

import { UserPlus, ShieldCheck, Lock, CircleHelp, ChevronLeft, ChevronRight } from "lucide-react";

const colaboradores = [
    {
        id: "JD",
        nombre: "Javier Dominguez",
        usuario: "jdominguez",
        rol: "SUPERVISOR",
        estado: "Activo",
        ultimoAcceso: "Hoy 08:12 AM",
        color: "bg-orange-100 text-orange-700",
    },
    {
        id: "MM",
        nombre: "Mariana Morales",
        usuario: "mmorales",
        rol: "AGRONOMO",
        estado: "Activo",
        ultimoAcceso: "Ayer 18:45 PM",
        color: "bg-amber-100 text-amber-700",
    },
    {
        id: "LC",
        nombre: "Luis Castillo",
        usuario: "lcastillo",
        rol: "OPERADOR",
        estado: "Inactivo",
        ultimoAcceso: "Hace 2 dias",
        color: "bg-gray-200 text-gray-600",
    },
    {
        id: "AR",
        nombre: "Ana Ruiz",
        usuario: "aruiz_field",
        rol: "OPERADOR",
        estado: "Activo",
        ultimoAcceso: "Hoy 09:30 AM",
        color: "bg-green-100 text-green-700",
    },
];

const camposAsignados = ["Zona Norte", "Invernadero 1-4", "Cereales A"];

export default function EquipoPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <button className="inline-flex items-center justify-center gap-2 bg-[#2D6A4F] hover:bg-[#24573f] transition-colors text-white px-5 py-3 rounded-xl text-[12px] font-black uppercase tracking-wide shadow-lg shadow-green-900/10">
                    <UserPlus size={16} />
                    Dar de Alta Nuevo Empleado
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
                <section className="bg-white dark:bg-[#1a1f25] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 h-fit">
                    <h2 className="text-[17px] font-black text-gray-900 dark:text-gray-100">Registro de Personal</h2>
                    <p className="text-[12px] text-gray-500 mt-1 mb-4">Configura el perfil de acceso inicial.</p>

                    <div className="space-y-3">
                        <Input label="Nombre Completo" value="Roberto Mendez" />
                        <Input label="Nombre de Usuario" value="rmendez" />
                        <Input label="Contrasena" value="********" type="password" />

                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Rol Operativo</label>
                            <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-gray-800 focus:outline-none focus:border-[#2D6A4F]">
                                <option>Operador</option>
                                <option>Agronomo</option>
                                <option>Supervisor</option>
                            </select>
                        </div>

                        <div>
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Campos Asignados</p>
                            <div className="space-y-2">
                                {camposAsignados.map((campo) => (
                                    <label key={campo} className="flex items-center gap-2 text-[13px] font-semibold text-gray-700">
                                        <input type="checkbox" defaultChecked className="accent-[#2D6A4F]" />
                                        {campo}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button className="w-full bg-[#2D6A4F] hover:bg-[#24573f] transition-colors text-white py-2.5 rounded-xl text-[12px] font-black uppercase tracking-wide">
                            Registrar Empleado
                        </button>
                    </div>
                </section>

                <section className="bg-white dark:bg-[#1a1f25] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                    <h2 className="text-[17px] font-black text-gray-900 dark:text-gray-100">Colaboradores Activos</h2>
                    <p className="text-[12px] text-gray-500 mt-1 mb-4">Listado completo del equipo y niveles de acceso.</p>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px]">
                            <thead>
                                <tr className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
                                    <th className="pb-3">Empleado</th>
                                    <th className="pb-3">Rol</th>
                                    <th className="pb-3">Estado</th>
                                    <th className="pb-3">Ultimo Acceso</th>
                                    <th className="pb-3">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {colaboradores.map((c) => (
                                    <tr key={c.usuario} className="border-b border-gray-50 dark:border-gray-800">
                                        <td className="py-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black ${c.color}`}>
                                                    {c.id}
                                                </div>
                                                <div>
                                                    <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100 leading-tight">{c.nombre}</p>
                                                    <p className="text-[11px] font-semibold text-gray-400">@{c.usuario}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <span className="inline-flex px-2.5 py-1 rounded-full bg-gray-100 text-[10px] font-black text-gray-600 uppercase tracking-wide">
                                                {c.rol}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <span className={`inline-flex items-center gap-1.5 text-[12px] font-bold ${c.estado === "Activo" ? "text-green-600" : "text-gray-400"}`}>
                                                <span className={`w-2 h-2 rounded-full ${c.estado === "Activo" ? "bg-green-500" : "bg-gray-300"}`} />
                                                {c.estado}
                                            </span>
                                        </td>
                                        <td className="py-3 text-[12px] font-semibold text-gray-500">{c.ultimoAcceso}</td>
                                        <td className="py-3 text-[12px] font-semibold text-gray-400">--</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-[12px] text-gray-500 font-semibold">
                        <p>Mostrando 4 de 28 empleados</p>
                        <div className="flex items-center gap-2">
                            <button className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center">
                                <ChevronLeft size={14} />
                            </button>
                            <button className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center">
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoCard
                    icon={<ShieldCheck size={16} className="text-green-700" />}
                    title="Seguridad de Datos"
                    description="Todos los accesos estan protegidos con encriptacion de grado bancario y registro de IP."
                />
                <InfoCard
                    icon={<Lock size={16} className="text-green-700" />}
                    title="Geocerca de Acceso"
                    description="Restringe el acceso a la plataforma unicamente cuando el personal se encuentre en los campos asignados."
                />
                <div className="rounded-2xl bg-[#2D6A4F] text-white p-5 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center mb-3">
                        <CircleHelp size={16} />
                    </div>
                    <h3 className="text-[16px] font-black">Necesitas ayuda?</h3>
                    <p className="text-[12px] text-white/85 mt-1 leading-relaxed">Configura flujos de trabajo personalizados para tu equipo de cosecha y mantenimiento.</p>
                    <button className="mt-4 text-[12px] font-black underline underline-offset-2">
                        Ver tutorial de roles
                    </button>
                </div>
            </div>
        </div>
    );
}

function Input({ label, value, type = "text" }) {
    return (
        <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">{label}</label>
            <input
                type={type}
                defaultValue={value}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-gray-800 focus:outline-none focus:border-[#2D6A4F]"
            />
        </div>
    );
}

function InfoCard({ icon, title, description }) {
    return (
        <div className="rounded-2xl bg-white dark:bg-[#1a1f25] border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center mb-3">{icon}</div>
            <h3 className="text-[16px] font-black text-gray-900 dark:text-gray-100">{title}</h3>
            <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">{description}</p>
        </div>
    );
}
