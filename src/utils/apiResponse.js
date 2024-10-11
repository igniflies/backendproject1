class ApiResponse {
    constructor(statusCode,dara,message="Success"){
        this.statusCode=statusCode;
        this.data=data;
        this.message=message
        this.success=statusCode <400

    }
}