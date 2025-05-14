import React from 'react'
import { CONFIG } from '@/config'
import { Button } from '@heroui/react'
import { ArrowUpRight } from 'lucide-react'
import AnimateComponent from './elements/AnimateComponent'

/* 
  Example: Splitting the sections into separate components
  for better readability and organization.
*/

function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center text-center gap-4 pt-24 pb-12 w-full max-w-4xl px-4">
      {/* Animated heading */}
      <AnimateComponent>
        <h1 className="text-5xl md:text-6xl font-extrabold">
          🐤 KwekKwek Web Starter
        </h1>
      </AnimateComponent>

      {/* Subheading / description */}
      <AnimateComponent delay={100}>
        <p className="text-base md:text-lg font-medium text-gray-600 dark:text-gray-300 max-w-md mx-auto">
          Cut your damn initiating codebase time
        </p>
      </AnimateComponent>
    </section>
  )
}

function LinksSection() {
  return (
    <AnimateComponent delay={300}>
      <div className="flex flex-wrap justify-center items-center gap-3 mt-6">
        <Button
          variant="outline"
          color="secondary"
          className="flex items-center gap-2 !font-medium !px-4 !py-2 !rounded-full hover:-translate-y-[1px] transition-transform"
          onPress={() => window.open(CONFIG.BUY_LINK, '_blank')}
          isDisabled={!CONFIG.BUY_LINK}
        >
          Buy Now
          <ArrowUpRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          color="secondary"
          className="flex items-center gap-2 !font-medium !px-4 !py-2 !rounded-full hover:-translate-y-[1px] transition-transform"
          onPress={() => window.open(CONFIG.DOCS_LINK, '_blank')}
          isDisabled={!CONFIG.DOCS_LINK}
        >
          Docs
          <ArrowUpRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          color="secondary"
          className="flex items-center gap-2 !font-medium !px-4 !py-2 !rounded-full hover:-translate-y-[1px] transition-transform"
          onPress={() => window.open(CONFIG.TWITTER_LINK, '_blank')}
          isDisabled={!CONFIG.TWITTER_LINK}
        >
          Twitter
          <ArrowUpRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          color="secondary"
          className="flex items-center gap-2 !font-medium !px-4 !py-2 !rounded-full hover:-translate-y-[1px] transition-transform"
          onPress={() => window.open(CONFIG.GITHUB_LINK, '_blank')}
          isDisabled={!CONFIG.GITHUB_LINK}
        >
          GitHub
          <ArrowUpRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          color="secondary"
          className="flex items-center gap-2 !font-medium !px-4 !py-2 !rounded-full hover:-translate-y-[1px] transition-transform"
          onPress={() => window.open(CONFIG.TELEGRAM_LINK, '_blank')}
          isDisabled={!CONFIG.TELEGRAM_LINK}
        >
          Telegram
          <ArrowUpRight className="w-4 h-4" />
        </Button>
      </div>
    </AnimateComponent>
  )
}

function NotesSection() {
  return (
    <AnimateComponent delay={400}>
      <div className="relative max-w-3xl mx-4 mt-16 p-4 sm:p-6 bg-white dark:bg-gray-800
                      rounded-lg shadow-md border border-gray-100 dark:border-gray-700
                      transition-colors">
        <h3 className="font-semibold text-xl text-gray-800 dark:text-gray-100 mb-4">
          Notes:
        </h3>
        <ul className="space-y-4 list-none">
          <li className="flex gap-3">
            <span className="text-primary">•</span>
            <span className="text-gray-700 dark:text-gray-300">
              For all the links related, use
              <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded mx-1">
                CONFIG
              </code>
              on
              <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded mx-1">
                src/config.js
              </code>.
              Make sure it has an empty/disabled state if the links are not available.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-primary">•</span>
            <span className="text-gray-700 dark:text-gray-300">
              For any elements like text and card, make sure to use scroll entry animation,
              try to use
              <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded mx-1">
                AnimateComponent
              </code>
              on
              <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded mx-1">
                src/components/elements/AnimateComponent.jsx
              </code>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-primary flex-shrink-0">•</span>
            <span className="text-gray-700 dark:text-gray-300">
              Interactivity like hover, click, moving background, etc. is HIGHLY encouraged.
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Resources:
                <div className="flex flex-wrap gap-2 mt-1">
                  <a href="https://magicui.design/" target="_blank" rel="noopener noreferrer"
                    className="text-primary hover:underline">magicui.design</a>
                  <a href="https://www.reactbits.dev/" target="_blank" rel="noopener noreferrer"
                    className="text-primary hover:underline">reactbits.dev</a>
                  <a href="https://www.aceternity.com/" target="_blank" rel="noopener noreferrer"
                    className="text-primary hover:underline">aceternity.com</a>
                  <a href="https://uiverse.io/cards" target="_blank" rel="noopener noreferrer"
                    className="text-primary hover:underline">uiverse.io/cards</a>
                  <a href="https://21st.dev" target="_blank" rel="noopener noreferrer"
                    className="text-primary hover:underline">21st.dev</a>
                </div>
              </div>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-primary">•</span>
            <span className="text-gray-700 dark:text-gray-300">
              Componentize each section of the page for better organization,
              like
              <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded mx-1">
                &lt;HeroSection /&gt;
              </code>
              ,
              <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded mx-1">
                &lt;FeaturesSection /&gt;
              </code>
              ,
              <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded mx-1">
                &lt;CTA /&gt;
              </code>
              , etc.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-primary">•</span>
            <span className="text-gray-700 dark:text-gray-300">
              Don't forget about the name and description of the project in meta tags on
              <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded mx-1">
                src/index.html
              </code>
            </span>
          </li>
        </ul>
      </div>
    </AnimateComponent>
  )
}

export default function WebstarterOnboarding() {
  return (
    <div
      className="
        relative min-h-screen px-4 w-full flex flex-col items-center justify-start 
        bg-gradient-to-tr from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800
        overflow-hidden
      "
    >
      {/* Decorative animated blob / gradient can be inserted here if you like */}
      <HeroSection />
      <LinksSection />
      <NotesSection />
    </div>
  )
}
