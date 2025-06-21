import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '../useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    jest.clearAllTimers()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))
    expect(result.current).toBe('initial')
  })

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 }
      }
    )

    expect(result.current).toBe('initial')

    // Change value
    rerender({ value: 'updated', delay: 500 })
    
    // Should still be initial value
    expect(result.current).toBe('initial')

    // Advance time by less than delay
    act(() => {
      jest.advanceTimersByTime(300)
    })
    expect(result.current).toBe('initial')

    // Advance time to complete delay
    act(() => {
      jest.advanceTimersByTime(200)
    })
    expect(result.current).toBe('updated')
  })

  it('should cancel previous timer when value changes rapidly', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 }
      }
    )

    // Change value multiple times rapidly
    rerender({ value: 'first', delay: 500 })
    act(() => {
      jest.advanceTimersByTime(100)
    })

    rerender({ value: 'second', delay: 500 })
    act(() => {
      jest.advanceTimersByTime(100)
    })

    rerender({ value: 'final', delay: 500 })
    
    // Should still be initial
    expect(result.current).toBe('initial')

    // Complete the delay
    act(() => {
      jest.advanceTimersByTime(500)
    })

    // Should be the final value, not intermediate ones
    expect(result.current).toBe('final')
  })

  it('should handle different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 100 }
      }
    )

    rerender({ value: 'updated', delay: 100 })
    
    act(() => {
      jest.advanceTimersByTime(100)
    })
    expect(result.current).toBe('updated')

    // Change delay
    rerender({ value: 'new', delay: 1000 })
    
    act(() => {
      jest.advanceTimersByTime(100)
    })
    expect(result.current).toBe('updated') // Should not update yet

    act(() => {
      jest.advanceTimersByTime(900)
    })
    expect(result.current).toBe('new')
  })

  it('should handle zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 0 }
      }
    )

    rerender({ value: 'updated', delay: 0 })
    
    act(() => {
      jest.advanceTimersByTime(0)
    })
    expect(result.current).toBe('updated')
  })

  it('should work with different data types', () => {
    // Test with numbers
    const { result: numberResult, rerender: numberRerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 0, delay: 100 }
      }
    )

    numberRerender({ value: 42, delay: 100 })
    act(() => {
      jest.advanceTimersByTime(100)
    })
    expect(numberResult.current).toBe(42)

    // Test with objects
    const { result: objectResult, rerender: objectRerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: { name: 'initial' }, delay: 100 }
      }
    )

    const newObj = { name: 'updated' }
    objectRerender({ value: newObj, delay: 100 })
    act(() => {
      jest.advanceTimersByTime(100)
    })
    expect(objectResult.current).toBe(newObj)

    // Test with arrays
    const { result: arrayResult, rerender: arrayRerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: [1, 2, 3], delay: 100 }
      }
    )

    const newArray = [4, 5, 6]
    arrayRerender({ value: newArray, delay: 100 })
    act(() => {
      jest.advanceTimersByTime(100)
    })
    expect(arrayResult.current).toBe(newArray)
  })

  it('should cleanup timer on unmount', () => {
    const { result, rerender, unmount } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 }
      }
    )

    rerender({ value: 'updated', delay: 500 })
    
    // Unmount before timer completes
    unmount()

    // Timer should be cleaned up
    act(() => {
      jest.advanceTimersByTime(500)
    })

    // Since component is unmounted, we can't check the result
    // But this test ensures no memory leaks or errors occur
  })

  it('should handle null and undefined values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: null as any, delay: 100 }
      }
    )

    expect(result.current).toBe(null)

    rerender({ value: undefined as any, delay: 100 })
    act(() => {
      jest.advanceTimersByTime(100)
    })
    expect(result.current).toBe(undefined)

    rerender({ value: 'not null', delay: 100 })
    act(() => {
      jest.advanceTimersByTime(100)
    })
    expect(result.current).toBe('not null')
  })

  it('should handle boolean values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: false, delay: 100 }
      }
    )

    expect(result.current).toBe(false)

    rerender({ value: true, delay: 100 })
    act(() => {
      jest.advanceTimersByTime(100)
    })
    expect(result.current).toBe(true)
  })

  it('should work with complex search scenarios', () => {
    // Simulate typing in a search box
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: '', delay: 300 }
      }
    )

    // User types "r"
    rerender({ value: 'r', delay: 300 })
    act(() => {
      jest.advanceTimersByTime(100)
    })
    expect(result.current).toBe('') // Still empty

    // User types "re"
    rerender({ value: 're', delay: 300 })
    act(() => {
      jest.advanceTimersByTime(100)
    })
    expect(result.current).toBe('') // Still empty

    // User types "restaurant"
    rerender({ value: 'restaurant', delay: 300 })
    act(() => {
      jest.advanceTimersByTime(300)
    })
    expect(result.current).toBe('restaurant') // Finally updates

    // User clears search
    rerender({ value: '', delay: 300 })
    act(() => {
      jest.advanceTimersByTime(300)
    })
    expect(result.current).toBe('') // Clears
  })
})