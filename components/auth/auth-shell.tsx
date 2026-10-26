import type { ReactNode } from 'react'
import Image from 'next/image'

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1.15fr)_minmax(28rem,0.85fr)]">
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#6f1b20] px-12 py-10 text-[#fffaf4] lg:flex xl:px-16">
        <div className="relative z-10 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5"><Image src="/scoe-logo.png" alt="SCOE logo" width={44} height={44} className="size-full object-contain" priority /></span>
          <div>
            <p className="text-sm font-semibold tracking-[0.18em]">ASTRA+</p>
            <p className="text-xs text-[#fffaf4]/60">CAMPUS WORKSPACE</p>
          </div>
        </div>

        <div className="relative z-10 max-w-2xl pb-10">
          <p className="mb-5 text-xs font-semibold tracking-[0.22em] text-[#f3b16f]">ONE CAMPUS. CLEARER MOMENTUM.</p>
          <h1 className="display-font max-w-xl text-5xl leading-[1.04] tracking-tight text-[#fffaf4] xl:text-6xl">A campus that moves as one.</h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-[#fffaf4]/70">Bring academic planning, everyday operations, and meaningful approvals into one calm, connected workspace.</p>
          <div className="mt-12 grid max-w-xl grid-cols-3 gap-5 border-t border-white/20 pt-5">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-[#f3b16f]">01</p>
              <p className="mt-2 text-sm text-[#fffaf4]/80">Stay aligned</p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-[#f3b16f]">02</p>
              <p className="mt-2 text-sm text-[#fffaf4]/80">Move decisions</p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-[#f3b16f]">03</p>
              <p className="mt-2 text-sm text-[#fffaf4]/80">See the whole picture</p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-[#fffaf4]/45">Astra+ Campus · Institutional operations</p>
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-1/4 size-[28rem] rounded-full border border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 top-[34%] size-80 rounded-full border border-white/10" />
      </section>

      <section className="flex min-h-screen flex-col justify-center px-5 py-8 sm:px-10 lg:px-14">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex size-10 items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-1.5"><Image src="/scoe-logo.png" alt="SCOE logo" width={40} height={40} className="size-full object-contain" priority /></span>
            <div>
              <p className="text-sm font-semibold tracking-[0.16em]">ASTRA+</p>
              <p className="text-xs text-muted-foreground">CAMPUS WORKSPACE</p>
            </div>
          </div>
          {children}
          <p className="mt-8 text-center text-xs text-muted-foreground">Secure access for your institutional community.</p>
        </div>
      </section>
    </main>
  )
}
