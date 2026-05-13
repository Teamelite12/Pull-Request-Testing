import java.util.Scanner;

public class ArmstrongNumber {
    public static boolean isArmstrong(int number) {
        if (number < 0) {
            return false;
        }

        int digits = String.valueOf(number).length();
        int originalNumber = number;
        long sum = 0;

        do {
            int digit = number % 10;
            sum += power(digit, digits);
            number /= 10;
        } while (number > 0);

        return sum == (long) originalNumber;
    }

    private static long power(int base, int exponent) {
        long result = 1;
        long value = base;
        int remainingExponent = exponent;

        while (remainingExponent > 0) {
            if ((remainingExponent & 1) == 1) {
                result *= value;
            }
            value *= value;
            remainingExponent >>= 1;
        }

        return result;
    }

    public static void main(String[] args) {
        try (Scanner scanner = new Scanner(System.in)) {
            System.out.print("Enter a number: ");
            if (!scanner.hasNextInt()) {
                System.out.println("Please enter a valid integer.");
                return;
            }

            int number = scanner.nextInt();

            if (isArmstrong(number)) {
                System.out.println(number + " is an Armstrong number.");
            } else {
                System.out.println(number + " is not an Armstrong number.");
            }
        }
    }
}
