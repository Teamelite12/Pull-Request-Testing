import java.util.Scanner;

public class ArmstrongNumber {
    public static boolean isArmstrong(int number) {
        if (number < 0) {
            return false;
        }

        int digits = String.valueOf(number).length();
        int originalNumber = number;
        int sum = 0;

        do {
            int digit = number % 10;
            sum += power(digit, digits);
            number /= 10;
        } while (number > 0);

        return sum == originalNumber;
    }

    private static int power(int base, int exponent) {
        int result = 1;
        for (int i = 0; i < exponent; i++) {
            result *= base;
        }
        return result;
    }

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        System.out.print("Enter a number: ");
        int number = scanner.nextInt();

        if (isArmstrong(number)) {
            System.out.println(number + " is an Armstrong number.");
        } else {
            System.out.println(number + " is not an Armstrong number.");
        }
    }
}
