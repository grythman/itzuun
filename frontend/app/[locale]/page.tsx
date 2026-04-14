"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function HomePage() {
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const locale = pathParts[0] === "en" || pathParts[0] === "mn" ? pathParts[0] : "mn";
  const withLocale = (href: string) => `/${locale}${href}`;

  return (
    <div className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 overflow-x-hidden bg-surface text-on-surface">
      <main>
        <section className="relative min-h-[820px] overflow-hidden px-6 pt-16 lg:px-10 xl:min-h-[870px]">
          <div className="mx-auto grid w-full max-w-[1680px] items-center gap-12 lg:grid-cols-12">
            <div className="z-10 lg:col-span-7">
              <span className="mb-6 block text-xs font-bold uppercase tracking-[0.2em] text-secondary">Professional Excellence</span>
              <h1 className="mn-text mb-8 text-5xl font-extrabold tracking-tight text-primary lg:text-7xl">
                Монголын хамгийн том мэдээлэл технологийн мэргэжилтнүүдийн талбар.
              </h1>
              <p className="mn-text mb-10 max-w-xl text-xl text-on-surface-variant opacity-90">
                Дэлхийн түвшний ур чадварыг эх орныхоо хөгжилд. Бид шилдэг инженерүүдийг шилдэг төслүүдтэй холбодог.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href={withLocale("/projects/new")}
                  className="rounded-md bg-gradient-to-br from-[#031636] to-[#1a2b4c] px-10 py-5 text-lg font-bold text-white transition-all duration-150 ease-in-out active:scale-95"
                >
                  Төсөл нийтлэх
                </Link>
                <Link
                  href={withLocale("/projects")}
                  className="rounded-md bg-surface-container-low px-10 py-5 text-lg font-bold text-primary transition-all duration-150 ease-in-out hover:bg-surface-container-high active:scale-95"
                >
                  Ажил хайх
                </Link>
              </div>
            </div>

            <div className="relative h-[520px] lg:col-span-5 lg:h-[600px]">
              <div className="absolute inset-0 scale-105 rotate-3 rounded-3xl bg-secondary/5" />
              <img
                className="relative z-10 h-full w-full rounded-3xl object-cover shadow-[0_20px_50px_rgba(3,22,54,0.1)]"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBOT2zxw3JU8x2NoyJTfp6ypWiZE2vvWToLlMhfTwFXzTrQdq9Mgv1Pv19HleG_DfyvbepvSjp2hd19b5QJegn2titT_3DildMpk109034vpFMbwRPOgez_k5rS3FCOeLSagV-uZRtOwJqcER84HPV8iQAFCCOaPsPw2u17xe_kSq83jSHF-MP4_0liYUVKf86f3Im8l_Cu80aXEzmSNR9p_4tQmkolEBg1K366KodzLcM8yZ1m_3flr9ZZFGueFwPvJEonix68qWw"
                alt="Modern architectural office"
              />
              <div className="glass-panel absolute -bottom-8 -left-8 z-20 max-w-[240px] rounded-xl p-6 shadow-2xl">
                <div className="mb-2 flex gap-2">
                  <span className="text-secondary">✦</span>
                  <span className="text-xs font-bold uppercase text-primary">Баталгаажсан</span>
                </div>
                <p className="text-sm font-medium">Шилдэг 1% инженерүүдтэй шууд холбогдоно.</p>
              </div>
            </div>
          </div>
          <div className="absolute right-0 top-0 -z-10 h-full w-1/3 translate-x-1/2 rounded-full bg-surface-container-low opacity-40 blur-[120px]" />
        </section>

        <section className="bg-surface-container-low py-20">
          <div className="mx-auto grid max-w-[1680px] grid-cols-1 gap-12 px-6 text-center md:grid-cols-3 lg:px-10">
            <div className="space-y-2">
              <div className="text-5xl font-black tracking-tighter text-primary">500+</div>
              <div className="text-xs font-bold uppercase tracking-widest text-secondary">Төслүүд</div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl font-black tracking-tighter text-primary">₮10B+</div>
              <div className="text-xs font-bold uppercase tracking-widest text-secondary">Гүйлгээ</div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl font-black tracking-tighter text-primary">2000+</div>
              <div className="text-xs font-bold uppercase tracking-widest text-secondary">Мэргэжилтнүүд</div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1680px] px-6 py-24 lg:px-10 lg:py-28">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <span className="mb-3 block text-xs font-bold uppercase tracking-[0.2em] text-secondary">Market Sectors</span>
              <h2 className="text-4xl font-bold text-primary">Чилэглэлүүд</h2>
            </div>
            <Link href={withLocale("/projects")} className="border-b border-primary/20 pb-1 font-bold text-primary transition-all hover:border-primary">
              Бүх салбарыг үзэх
            </Link>
          </div>

          <div className="grid h-auto gap-6 md:grid-cols-4 md:grid-rows-2 lg:h-[700px]">
            <div className="group relative overflow-hidden rounded-xl bg-surface-container-lowest p-10 shadow-sm transition-all hover:shadow-xl md:col-span-2 md:row-span-2">
              <div className="relative z-10 flex h-full flex-col">
                <span className="mb-6 text-4xl text-secondary">▣</span>
                <h3 className="mb-4 text-3xl font-bold text-primary">Web Development</h3>
                <p className="max-w-xs text-on-surface-variant">High-performance web apps tailored for enterprises.</p>
                <div className="mt-auto">
                  <span className="flex items-center gap-2 text-sm font-bold text-primary transition-transform group-hover:translate-x-2">Explore →</span>
                </div>
              </div>
              <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-surface-container opacity-20 transition-transform duration-700 group-hover:scale-125" />
            </div>

            <div className="group relative overflow-hidden rounded-xl bg-primary p-8 text-white">
              <span className="mb-4 block text-3xl text-tertiary-fixed">▯</span>
              <h3 className="mb-2 text-xl font-bold">Mobile Dev</h3>
              <p className="text-sm text-white/60">iOS & Android solutions.</p>
            </div>

            <div className="group relative overflow-hidden rounded-xl bg-secondary p-8 text-white">
              <span className="mb-4 block text-3xl">△</span>
              <h3 className="mb-2 text-xl font-bold">UI/UX Design</h3>
              <p className="text-sm text-white/60">Architecture-driven design.</p>
            </div>

            <div className="group flex items-center justify-between rounded-xl bg-surface-container-low p-8 transition-colors hover:bg-surface-container-high md:col-span-2">
              <div>
                <span className="mb-4 block text-3xl text-primary">▤</span>
                <h3 className="mb-2 text-xl font-bold text-primary">Data Science</h3>
                <p className="text-sm text-on-surface-variant">Actionable business intelligence.</p>
              </div>
              <span className="text-4xl text-primary/10 transition-colors group-hover:text-primary/30">◍</span>
            </div>
          </div>
        </section>

        <section className="overflow-hidden bg-primary py-24 text-white lg:py-28">
          <div className="relative mx-auto max-w-[1680px] px-6 lg:px-10">
            <div className="mb-16 max-w-2xl lg:mb-20">
              <h2 className="mb-6 text-5xl font-bold">Хэрхэн ажилладаг вэ?</h2>
              <p className="text-lg text-primary-fixed/60">ITZuun систем нь төсөл эхлэхээс дуусах хүртэлх бүх шатыг мэргэжлийн түвшинд зохион байгуулдаг.</p>
            </div>
            <div className="grid gap-16 md:grid-cols-2 lg:gap-20">
              <div className="relative space-y-16 lg:space-y-20">
                <div className="absolute bottom-0 left-[31px] top-0 z-0 w-[2px] bg-primary-container" />
                {[{
                  i: "1",
                  title: "Төслөө нийтлэх",
                  text: "Шаардлагаа тодорхойлж, төслөө үнэгүй байршуулна. Манай алгоритм хамгийн тохиромжтой мэргэжилтнүүдийг санал болгоно.",
                  active: true,
                }, {
                  i: "2",
                  title: "Мэргэжилтнээ сонгох",
                  text: "Портфолио, үнэлгээ болон ажлын туршлагатай танилцаж, ярилцлага хийсний үндсэн дээр сонголтоо хийнэ.",
                  active: false,
                }, {
                  i: "3",
                  title: "Хамтын ажиллагаа",
                  text: "Милестон систем ашиглан төслийн явцыг хянаж, үе шат бүрт үр дүнг хүлээн авна.",
                  active: false,
                }].map((step) => (
                  <div key={step.i} className="relative z-10 flex gap-8 lg:gap-12">
                    <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold ${step.active ? "bg-secondary text-white shadow-[0_0_30px_rgba(19,105,106,0.4)]" : "border border-outline/20 bg-primary-container text-white"}`}>
                      {step.i}
                    </div>
                    <div>
                      <h4 className="mb-3 text-2xl font-bold">{step.title}</h4>
                      <p className="max-w-sm text-primary-fixed/60">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative hidden md:block">
                <div className="sticky top-40 rounded-2xl border border-white/5 bg-primary-container/30 p-8 backdrop-blur-sm">
                  <div className="mb-8 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/20 text-secondary">🛡</div>
                    <div className="text-sm font-bold uppercase tracking-widest text-secondary">Escrow Protected</div>
                  </div>
                  <div className="space-y-6">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-primary/40"><div className="h-full w-2/3 bg-secondary" /></div>
                    <div className="flex justify-between text-xs font-bold text-primary-fixed/40"><span>Milestone 01: UI Prototype</span><span className="text-secondary">Completed</span></div>
                    <div className="h-[1px] bg-white/5" />
                    <div className="h-2 w-full rounded-full bg-primary/40" />
                    <div className="flex justify-between text-xs font-bold text-primary-fixed/40"><span>Milestone 02: Core Features</span><span>In Progress</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-24 lg:px-10 lg:py-28">
          <div className="relative mx-auto flex max-w-[1680px] flex-col items-center gap-12 overflow-hidden rounded-3xl bg-surface-container-lowest p-10 md:flex-row md:gap-16 md:p-16">
            <div className="z-10 flex-1">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-2 text-secondary">
                <span className="text-sm">🛡</span>
                <span className="text-xs font-bold uppercase tracking-widest">Financial Safety</span>
              </div>
              <h2 className="mb-8 text-4xl font-extrabold tracking-tight text-primary md:text-5xl">ITZuun Escrow - Төлбөрийн 100% баталгаа.</h2>
              <p className="mb-10 max-w-xl text-lg leading-relaxed text-on-surface-variant">
                Ажил захиалагч төлбөрөө байршуулж, ажил гүйцэтгэгч үр дүнгээ хүлээлгэн өгснөөр төлбөр шилжинэ. Энэ нь хоёр талын итгэлцлийг бүрэн хангадаг.
              </p>
              <ul className="mb-10 space-y-4">
                <li className="flex items-center gap-3 font-semibold text-primary"><span className="text-secondary">●</span> Үр дүнд суурилсан төлбөр</li>
                <li className="flex items-center gap-3 font-semibold text-primary"><span className="text-secondary">●</span> Маргаан шийдвэрлэх систем</li>
                <li className="flex items-center gap-3 font-semibold text-primary"><span className="text-secondary">●</span> Шилэн гүйлгээ</li>
              </ul>
            </div>
            <div className="relative flex-1">
              <img
                className="relative z-10 rounded-2xl shadow-2xl"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfcAiw6tU-cbRJpatGcubv-BuDeFAlPIPia8__yYL8TlMEgMGqFmhsQYREUPtNImFColMuRPyLYakoRrwkVAd7ma4ppVBjexCbBQk4kJ6c7NzbgxT3Tb-Ft-nRa4hqREb8gNY1q0_T-sa7Mz39Jjb5wptIQl8Dqwx62DpXK4pagtRislm9rmdHo0IossrRkRN1oqXq4nm7zbjR59k1L5UocL-CpAkgmb8higlir-0nzn8z1XoIlmnUaFnb25rTmYEIqdIW8gxSTIo"
                alt="Escrow finance workspace"
              />
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-secondary/5 blur-3xl" />
            </div>
          </div>
        </section>

        <section className="px-6 py-24 text-center lg:px-10 lg:py-28">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-5xl font-black tracking-tighter text-primary md:text-6xl">Монголын дижитал ирээдүйг хамтдаа бүтээцгээе.</h2>
            <div className="mt-12 flex justify-center">
              <Link href={withLocale("/auth?tab=register")} className="rounded-md bg-gradient-to-br from-[#031636] to-[#1a2b4c] px-16 py-6 text-xl font-bold text-white transition-all hover:shadow-[0_20px_50px_rgba(3,22,54,0.2)] active:scale-95">
                Өнөөдөр эхлэх
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto bg-[#eceef0] px-6 py-16 text-[#031636] lg:px-10">
        <div className="mx-auto grid max-w-[1680px] grid-cols-2 gap-12 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4 text-xl font-black text-[#031636]">ITZuun</div>
            <p className="mb-6 max-w-xs text-sm text-[#191c1e]/60">Mongolian-led Architectural Engineering for the digital age.</p>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-widest opacity-40">Company</span>
            <Link className="text-sm text-[#191c1e]/60 transition-all duration-300 hover:text-[#031636] hover:underline" href={withLocale("/about")}>About Us</Link>
            <Link className="text-sm text-[#191c1e]/60 transition-all duration-300 hover:text-[#031636] hover:underline" href={withLocale("/support")}>Contact</Link>
            <Link className="text-sm text-[#191c1e]/60 transition-all duration-300 hover:text-[#031636] hover:underline" href={withLocale("/support")}>Cyrillic Support</Link>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-widest opacity-40">Legal</span>
            <Link className="text-sm text-[#191c1e]/60 transition-all duration-300 hover:text-[#031636] hover:underline" href={withLocale("/terms")}>Terms of Service</Link>
            <Link className="text-sm text-[#191c1e]/60 transition-all duration-300 hover:text-[#031636] hover:underline" href={withLocale("/privacy")}>Privacy Policy</Link>
            <Link className="text-sm text-[#191c1e]/60 transition-all duration-300 hover:text-[#031636] hover:underline" href={withLocale("/projects")}>Escrow Safety</Link>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-widest opacity-40">Connect</span>
            <div className="flex gap-4">
              <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#031636]/5 transition-colors hover:bg-secondary hover:text-white">@</div>
              <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#031636]/5 transition-colors hover:bg-secondary hover:text-white">◉</div>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-20 flex max-w-[1680px] flex-col items-center justify-between gap-4 border-t border-[#031636]/5 pt-8 md:flex-row">
          <p className="text-xs font-medium tracking-tight text-[#191c1e]/40">© 2024 ITZuun Marketplace. Mongolian-led Architectural Engineering.</p>
          <div className="flex gap-8">
            <span className="text-xs font-bold text-secondary">MN</span>
            <span className="text-xs font-bold opacity-20">EN</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
