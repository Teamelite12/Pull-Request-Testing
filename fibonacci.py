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
    try:
        number = int(input("Enter a non-negative integer: ").strip())
    except ValueError:
        print("Invalid input: please enter a whole number.")
    else:
        try:
            print(f"Fibonacci({number}) = {fibonacci(number)}")
        except ValueError as error:
            print(f"Invalid input: {error}")
