def fibonacci(n):
    if n < 0:
        raise ValueError("n must be a non-negative integer")
    if n == 0:
        return 0
    if n == 1:
        return 1

    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b


if __name__ == "__main__":
    number = int(input("Enter a non-negative integer: ").strip())
    print(f"Fibonacci({number}) = {fibonacci(number)}")
