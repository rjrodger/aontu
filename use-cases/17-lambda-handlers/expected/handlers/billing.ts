import { getSeneca } from '../../env/lambda/lambda'

function complete(seneca: any) {
  seneca.listen({type:'sqs',pin:'sys:billing,cmd:charge'})
  seneca.listen({type:'sqs',pin:'sys:billing,cmd:refund'})
  seneca.client({type:'sqs',pin:'sys:notify'})
}

exports.handler = async (
  event:any,
  context:any
) => {
  
  let seneca = await getSeneca('billing', complete)
  
  let handler = seneca.export('gateway-lambda/handler')
  let res = await handler(event, context)
  return res
}
