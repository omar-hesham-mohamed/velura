import { IsInt, IsNumber, IsString, IsNotEmpty} from 'class-validator';

export class CreatePaymentDto {
    @IsInt()
    orderId: number;

    @IsNumber()
    amount: number;

    @IsString()
    @IsNotEmpty()
    status: string;
}