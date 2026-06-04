import { describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppProvider, useAppContext } from '../../app/context/AppContext'

function TestConsumer() {
  const { executing, setExecuting, currentPage, setCurrentPage } = useAppContext()
  return (
    <div>
      <span data-testid="executing">{String(executing)}</span>
      <span data-testid="page">{currentPage}</span>
      <button onClick={() => setExecuting(true)}>実行開始</button>
      <button onClick={() => setCurrentPage('map')}>地図ページへ</button>
    </div>
  )
}

describe('AppContext', () => {
  it('初期値は executing=false, currentPage=""', () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )
    expect(screen.getByTestId('executing').textContent).toBe('false')
    expect(screen.getByTestId('page').textContent).toBe('')
  })

  it('setExecuting(true) で executing が true になる', async () => {
    const user = userEvent.setup()
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )
    await user.click(screen.getByText('実行開始'))
    expect(screen.getByTestId('executing').textContent).toBe('true')
  })

  it('setCurrentPage("map") で currentPage が "map" になる', async () => {
    const user = userEvent.setup()
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )
    await user.click(screen.getByText('地図ページへ'))
    expect(screen.getByTestId('page').textContent).toBe('map')
  })

  it('複数の子コンポーネントが同じ Context 値を共有する', () => {
    function AnotherConsumer() {
      const { executing } = useAppContext()
      return <span data-testid="another">{String(executing)}</span>
    }
    render(
      <AppProvider>
        <TestConsumer />
        <AnotherConsumer />
      </AppProvider>
    )
    expect(screen.getByTestId('executing').textContent).toBe(
      screen.getByTestId('another').textContent
    )
  })
})
